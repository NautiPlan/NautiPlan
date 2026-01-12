use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct FileData {
    pub data: String,   // mime
    pub base64: String, // base64
}

#[derive(Debug, Deserialize)]
struct DashScopeResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: Message,
}

#[derive(Debug, Deserialize)]
struct Message {
    content: Option<String>,
}

pub async fn call_image_gpt(images: Vec<FileData>, api_key: String) -> Result<String, String> {
    if images.is_empty() {
        return Err("images 不能为空".to_string());
    }

    let mut content: Vec<serde_json::Value> = Vec::with_capacity(images.len() + 1);

    for img in images {
        let url = format!("data:{};base64,{}", img.data, img.base64);
        content.push(serde_json::json!({
            "type": "image_url",
            "image_url": { "url": url }
        }));
    }

    content.push(serde_json::json!({
        "type": "text",
        "text": "详细总结途中描述的内容或知识点，仅仅描述，不要说多余的话。"
    }));

    let payload = serde_json::json!({
        "model": "qwen3-vl-flash",
        "messages": [
            {
                "role": "user",
                "content": content
            }
        ]
    });

    let client = reqwest::Client::new();
    let resp = client
        .post("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions")
        .bearer_auth(api_key)
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
    Ok(data
        .choices
        .get(0)
        .and_then(|c| c.message.content.clone())
        .unwrap_or_default())
}
