use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct FileData {
    pub data: String,   // mime
    pub base64: String, // base64
}

#[derive(Debug, Deserialize)]
struct DashScopeResponse {
    output: Output,
}

#[derive(Debug, Deserialize)]
struct Output {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: Message,
}

#[derive(Debug, Deserialize)]
struct Message {
    content: Vec<ContentItem>,
}

#[derive(Debug, Deserialize)]
struct ContentItem {
    text: Option<String>,
}

pub async fn call_audio_gpt(
    app: tauri::AppHandle,
    audios: Vec<FileData>,
) -> Result<String, String> {
    let api_key = crate::commands::load_ali_api_key(&app)?;

    if audios.is_empty() {
        return Err("audios 不能为空".to_string());
    }

    let client = reqwest::Client::new();
    let mut results: Vec<String> = Vec::with_capacity(audios.len());

    for audio in audios {
        let data_uri = format!("data:{};base64,{}", audio.data, audio.base64);

        let payload = serde_json::json!({
            "model": "qwen3-asr-flash",
            "input": {
                "messages": [
                    { "role": "system", "content": [ { "text": "" } ] },
                    { "role": "user",   "content": [ { "audio": data_uri } ] }
                ]
            },
            "parameters": {
                "result_format": "message",
                "asr_options": {
                    "enable_itn": false
                }
            }
        });

        let resp = client
            .post("https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation")
            .bearer_auth(&api_key)
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("请求失败: {e}"))?;

        let status = resp.status();
        if !status.is_success() {
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("HTTP {}: {}", status, text));
        }

        let data: DashScopeResponse = resp.json().await.map_err(|e| format!("解析失败: {e}"))?;

        let text = data
            .output
            .choices
            .get(0)
            .map(|c| {
                c.message
                    .content
                    .iter()
                    .filter_map(|x| x.text.as_deref())
                    .collect::<Vec<_>>()
                    .join("")
            })
            .unwrap_or_default();

        results.push(text);
    }

    Ok(results.join("\n"))
}
