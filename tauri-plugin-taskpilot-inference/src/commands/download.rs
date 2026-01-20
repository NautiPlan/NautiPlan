use tauri::{AppHandle, Manager, command, Emitter, Runtime};
use serde::{Deserialize, Serialize};
use crate::error::{Error, Result};
use tokio::fs;
use tokio::io::AsyncWriteExt;
use futures_util::StreamExt;
use tauri::path::BaseDirectory;

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

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub is_dir: bool,
}

#[command]
pub async fn list_dir_contents(
    path: String,
) -> Result<Vec<FileInfo>> {
    let mut files = Vec::new();
    let root = std::path::Path::new(&path);
    
    if !root.exists() {
        return Ok(files);
    }

    let mut entries = fs::read_dir(root).await?;
    while let Some(entry) = entries.next_entry().await? {
        let meta = entry.metadata().await?;
        files.push(FileInfo {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            size: meta.len(),
            is_dir: meta.is_dir(),
        });
    }

    Ok(files)
}

#[command]
pub async fn download_model<R: Runtime>(
    app_handle: AppHandle<R>,
    model_id: String,
) -> Result<String> {
    println!("Starting download for model: {}", model_id);

    // 获取 App 的隐私数据目录
    let app_dir = app_handle.path().resolve(format!("models/{}", model_id), BaseDirectory::AppData)
        .map_err(|e| Error::DownloadError(format!("Failed to resolve app data dir: {}", e)))?;
    
    println!("Storage path: {:?}", app_dir);

    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36")
        .build()
        .map_err(|e| Error::DownloadError(format!("Failed to create client: {}", e)))?;

    // 1. 获取文件列表
    let list_url = format!("https://modelscope.cn/api/v1/models/{}/repo/files?Recursive=true", model_id);
    println!("Fetching URL: {}", list_url);
    
    let resp = client.get(&list_url).send().await
        .map_err(|e| Error::DownloadError(format!("Network error: {}", e)))?;
    
    if !resp.status().is_success() {
        let status = resp.status();
        let err_body = resp.text().await.unwrap_or_default();
        let msg = format!("ModelScope Error: {} - {}", status, err_body);
        println!("{}", msg);
        return Err(Error::DownloadError(msg));
    }

    let files_resp = resp.json::<ModelFilesResponse>().await
        .map_err(|e| Error::DownloadError(format!("Parse error: {}", e)))?;

    let repo_files: Vec<ModelFile> = files_resp.data.files.into_iter().filter(|f| f.r#type == "blob").collect();
    let total_files = repo_files.len();
    println!("Total files to download: {}", total_files);

    // 2. 遍历并下载文件
    for (i, repo_file) in repo_files.into_iter().enumerate() {
        let download_url = format!("https://modelscope.cn/models/{}/resolve/master/{}", model_id, repo_file.path);
        let dest_path = app_dir.join(&repo_file.path);

        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        // 检查文件是否已存在且大小一致 (简单校验)
        if dest_path.exists() {
            let meta = fs::metadata(&dest_path).await?;
            if meta.len() == repo_file.size {
                println!("[{}/{}] Skipping existing file: {}", i + 1, total_files, repo_file.path);
                continue;
            }
        }

        println!("[{}/{}] Downloading: {} ({} bytes)", i + 1, total_files, repo_file.path, repo_file.size);

        let mut stream = client.get(download_url).send().await
            .map_err(|e| Error::DownloadError(format!("Failed to start download for {}: {}", repo_file.path, e)))?
            .bytes_stream();

        let mut out_file = fs::File::create(&dest_path).await?;
        let mut downloaded = 0;

        while let Some(item) = stream.next().await {
            let chunk = item.map_err(|e| Error::DownloadError(format!("Download error for {}: {}", repo_file.path, e)))?;
            out_file.write_all(&chunk).await?;
            downloaded += chunk.len() as u64;
            
            // 发送下载进度到前端
            let _ = app_handle.emit("taskpilot://download-progress", DownloadProgress {
                model_id: model_id.clone(),
                file_path: repo_file.path.clone(),
                current: downloaded,
                total: repo_file.size,
            });
        }
        out_file.flush().await?;
        println!("Finished downloading: {}", repo_file.path);
    }

    println!("Successfully downloaded all files for model: {}", model_id);
    // 返回模型存放的完整绝对路径
    Ok(app_dir.to_string_lossy().to_string())
}
