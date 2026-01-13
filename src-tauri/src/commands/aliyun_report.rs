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
pub struct MonthlyReport {
    pub summary: String,
    pub achievements: Vec<String>,
    pub challenges: Vec<String>,
    pub recommendations: Vec<String>,
}

pub async fn call_report_gpt(app: tauri::AppHandle, prompt: String) -> Result<String, String> {
    let api_key = crate::commands::load_ali_api_key(&app)?;

    if prompt.trim().is_empty() {
        return Err("prompt 不能为空".to_string());
    }
    if api_key.trim().is_empty() {
        return Err("api_key 不能为空".to_string());
    }

    let system_prompt = r#"你是一位专业的项目助理和数据分析师。
根据用户提供的任务数据和个人目标，为用户生成一份详细的月度总结报告。
要求：仅输出 JSON，必须严格符合 schema，不要输出任何多余文字。"#;

    // JSON Schema：固定输出 MonthlyReport 结构
    let report_schema = serde_json::json!({
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "summary": { "type": "string" },
            "achievements": {
                "type": "array",
                "items": { "type": "string" }
            },
            "challenges": {
                "type": "array",
                "items": { "type": "string" }
            },
            "recommendations": {
                "type": "array",
                "items": { "type": "string" }
            }
        },
        "required": ["summary", "achievements", "challenges", "recommendations"]
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
                "name": "monthly_report",
                "schema": report_schema,
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

    let report: MonthlyReport = serde_json::from_str(&content)
        .map_err(|e| format!("结构化JSON解析失败: {e}. 原始content: {content}"))?;

    serde_json::to_string(&report).map_err(|e| format!("序列化失败: {e}"))
}
