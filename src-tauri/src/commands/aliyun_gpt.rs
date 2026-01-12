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

#[tauri::command]
pub async fn call_gpt(prompt: String, api_key: String) -> Result<String, String> {
    if prompt.trim().is_empty() {
        return Err("prompt 不能为空".to_string());
    }
    if api_key.trim().is_empty() {
        return Err("api_key 不能为空".to_string());
    }

    let system_prompt = r#"你是一个AI日程管理助手，你会得到一段我的计划的相关描述，
你需要针对这段计划的相关描述，分解这个计划成多个子任务，通过完成这些子任务来完成这个计划，把这些子任务安排到每天去，注意一定要仔细地划分子任务
注意：仅仅输出JSON数组，不要有任何多余的文字说明，数组中的每个元素代表一个子任务，
以JSON方式为我安排计划，你可以参考以下样例（假如我一共有4天时间）：
[
  {
    "id": "task-001",
    "name": "需求分析",
    "day": "1",
  },
  {
    "id": "task-002",
    "name": "原型设计",
    "day": "2",
  },
  {
    "id": "task-003",
    "name": "开发实现",
    "day": "3",
  },
  {
    "id": "task-004",
    "name": "测试",
    "day": "4",
  }
]
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
