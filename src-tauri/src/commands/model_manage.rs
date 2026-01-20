use crate::commands::get_sandbox_dir::get_sandbox_dir;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use tokio::fs;
use tokio::io::AsyncWriteExt;

#[derive(Debug, Deserialize)]
struct ModelFilesResponse {
    #[serde(rename = "Data")]
    data: Data,
}

#[derive(Debug, Deserialize)]
struct Data {
    #[serde(rename = "Files")]
    files: Vec<ModelFile>,
}

#[derive(Debug, Deserialize)]
struct ModelFile {
    #[serde(rename = "Path")]
    path: String,
    #[serde(rename = "Type")]
    r#type: String,
    #[serde(rename = "Size")]
    size: u64,
}

#[derive(Serialize, Clone)]
struct DownloadProgress {
    model_id: String,
    file_path: String,
    current: u64,
    total: u64,
}

pub async fn list_models(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    let base_dir = get_sandbox_dir(app.clone())?;
    let app_dir = std::path::Path::new(&base_dir).join("models");

    if !app_dir.exists() {
        return Ok(files);
    }

    let mut entries = fs::read_dir(app_dir).await.map_err(|e| e.to_string())?;
    while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
        files.push(entry.file_name().to_string_lossy().to_string());
    }

    Ok(files)
}

pub async fn download(id: String, app: tauri::AppHandle) -> Result<String, String> {
    let base_dir = get_sandbox_dir(app.clone())?;
    let app_dir = std::path::Path::new(&base_dir).join("models").join(&id);

    println!("Storage path: {:?}", app_dir);

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36")
        .build()
        .map_err(|e|format!("Failed to create client: {}", e))?;

    let list_url = format!(
        "https://modelscope.cn/api/v1/models/{}/repo/files?Recursive=true",
        id
    );
    println!("Fetching URL: {}", list_url);

    let resp = client
        .get(&list_url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let err_body = resp.text().await.unwrap_or_default();
        let msg = format!("ModelScope Error: {} - {}", status, err_body);
        println!("{}", msg);
        return Err(msg);
    }

    let files_resp = resp
        .json::<ModelFilesResponse>()
        .await
        .map_err(|e| (format!("Parse error: {}", e)))?;

    let repo_files: Vec<ModelFile> = files_resp
        .data
        .files
        .into_iter()
        .filter(|f| f.r#type == "blob")
        .collect();
    let total_files = repo_files.len();
    println!("Total files to download: {}", total_files);

    for (i, repo_file) in repo_files.into_iter().enumerate() {
        let download_url = format!(
            "https://modelscope.cn/models/{}/resolve/master/{}",
            id, repo_file.path
        );
        let dest_path = app_dir.join(&repo_file.path);

        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| e.to_string())?;
        }

        // 检查文件是否已存在且大小一致
        if dest_path.exists() {
            let meta = fs::metadata(&dest_path).await.map_err(|e| e.to_string())?;
            if meta.len() == repo_file.size {
                println!(
                    "[{}/{}] Skipping existing file: {}",
                    i + 1,
                    total_files,
                    repo_file.path
                );
                continue;
            }
        }

        println!(
            "[{}/{}] Downloading: {} ({} bytes)",
            i + 1,
            total_files,
            repo_file.path,
            repo_file.size
        );

        let mut stream = client
            .get(download_url)
            .send()
            .await
            .map_err(|e| format!("Failed to start download for {}: {}", repo_file.path, e))?
            .bytes_stream();

        let mut out_file = fs::File::create(&dest_path)
            .await
            .map_err(|e| e.to_string())?;
        let mut downloaded = 0;

        while let Some(item) = stream.next().await {
            let chunk =
                item.map_err(|e| format!("Download error for {}: {}", repo_file.path, e))?;
            out_file
                .write_all(&chunk)
                .await
                .map_err(|e| e.to_string())?;
            downloaded += chunk.len() as u64;

            let _ = app.emit(
                "taskpilot://download-progress",
                DownloadProgress {
                    model_id: id.clone(),
                    file_path: repo_file.path.clone(),
                    current: downloaded,
                    total: repo_file.size,
                },
            );
        }
        out_file.flush().await.map_err(|e| e.to_string())?;
        println!("Finished downloading: {}", repo_file.path);
    }

    println!("Successfully downloaded all files for model: {}", id);
    // 返回模型存放的沙箱路径
    Ok(app_dir.to_string_lossy().to_string())
}
