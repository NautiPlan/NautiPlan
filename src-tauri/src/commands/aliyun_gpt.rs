use serde::{Deserialize, Serialize};

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TempTask {
    pub id: String,
    pub name: String,
    pub day: String,
}

#[tauri::command]
pub async fn call_gpt(app: tauri::AppHandle, prompt: String) -> Result<String, String> {
    let api_key = crate::commands::load_ali_api_key(&app)?;

    if prompt.trim().is_empty() {
        return Err("prompt 不能为空".to_string());
    }
    if api_key.trim().is_empty() {
        return Err("api_key 不能为空".to_string());
    }

    let system_prompt = r#"你是一个AI日程管理助手。
请根据用户提供的计划描述，拆解为多个子任务，并把每个子任务安排到第几天（从1开始）。
要求：任务要具体可执行；输出必须严格符合 schema；不要输出任何多余文字。"#;

    let task_array_schema = serde_json::json!({
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "id":  { "type": "string" },
                "name":{ "type": "string" },
                "day": { "type": "string", "pattern": "^[1-9][0-9]*$" }
            },
            "required": ["id", "name", "day"]
        }
    });

    let payload = serde_json::json!({
        "model": "qwen-plus",
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": prompt }
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "temp_tasks",
                "schema": task_array_schema,
                "strict": true
            }
        }
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
    let content = data
        .choices
        .get(0)
        .and_then(|c| c.message.content.clone())
        .unwrap_or_default();

    let tasks: Vec<TempTask> = serde_json::from_str(&content)
        .map_err(|e| format!("结构化JSON解析失败: {e}. 原始content: {content}"))?;

    serde_json::to_string(&tasks).map_err(|e| format!("序列化失败: {e}"))
}
