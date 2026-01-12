use serde::Deserialize;

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

pub async fn call_report_gpt(prompt: String, api_key: String) -> Result<String, String> {
    if prompt.trim().is_empty() {
        return Err("prompt 不能为空".to_string());
    }
    if api_key.trim().is_empty() {
        return Err("api_key 不能为空".to_string());
    }

    let system_prompt = r#"请你扮演一位专业的项目助理和数据分析师。
根据用户提供的任务数据和个人目标，为用户生成一份详细的月度总结报告。

请你严格按照以下JSON格式返回你的分析报告，不要添加任何额外的解释或说明文字，直接输出JSON对象：
{
  "summary": "对本月整体表现的总结，大约100-150字。",
  "achievements": ["识别出的主要成就，以字符串数组形式列出，每项成就都是一个独立的字符串。"],
  "challenges": ["识别出的主要挑战或困难，以字符串数组形式列出，每项挑战都是一个独立的字符串。"],
  "recommendations": ["根据本月表现提出的具体改进建议，以字符串数组形式列出，每项建议都是一个独立的字符串。"]
}
"#;

    let payload = serde_json::json!({
        "model": "qwen-plus",
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": prompt }
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
