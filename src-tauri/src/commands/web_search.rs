use serde::{Deserialize, Serialize};
use serde_json::Value;

const DOMAIN: &str = "https://api.bochaai.com";
const WEB_SEARCH_URL: &str = "/v1/web-search";
const RERANK_URL: &str = "/v1/rerank";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebSearchRes {
    pub id: String,
    pub name: String,
    pub url: String,
    pub snippet: String,
    pub summary: String,
    pub site_icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RerankedWebSearchRes {
    pub index: usize,
    pub document: WebSearchRes,
    pub relevance_score: f64,
}

fn load_web_api_key(app: &tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_secure_storage::{GetRequest, SecureStorageExt};

    let resp = app
        .secure_storage()
        .get(GetRequest {
            key: "WEBAPI_KEY".to_string(),
        })
        .map_err(|e| e.to_string())?;

    resp.value
        .filter(|v| !v.trim().is_empty())
        .ok_or_else(|| "未设置 WEBAPI_KEY（请先在 App 内保存 Key）".to_string())
}

pub async fn web_search(app: tauri::AppHandle, query: String) -> Result<Vec<WebSearchRes>, String> {
    let api_key = load_web_api_key(&app)?;
    let body = serde_json::json!({
        "query": query,
        "freshness": "nolimit",
        "summary": true,
        "include": "bilibili.com|github.com",
        "count": 50
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{DOMAIN}{WEB_SEARCH_URL}"))
        .bearer_auth(api_key)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("WebSearch 请求失败: {e}"))?;

    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(format!("WebSearch HTTP {}: {}", status, text));
    }

    let data: Value =
        serde_json::from_str(&text).map_err(|e| format!("WebSearch 解析失败: {e}"))?;
    if data["code"].as_i64() != Some(200) {
        return Err(format!("WebSearch 业务错误: {}", text));
    }

    let items = data["data"]["webPages"]["value"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    let out = items
        .into_iter()
        .map(|item| WebSearchRes {
            id: item["id"].as_str().unwrap_or_default().to_string(),
            name: item["name"].as_str().unwrap_or_default().to_string(),
            url: item["url"].as_str().unwrap_or_default().to_string(),
            snippet: item["snippet"].as_str().unwrap_or_default().to_string(),
            summary: item["summary"].as_str().unwrap_or_default().to_string(),
            site_icon: item["siteIcon"].as_str().unwrap_or("").to_string(),
        })
        .collect();

    Ok(out)
}

pub async fn rerank_web_search_results(
    app: tauri::AppHandle,
    query: String,
    documents: Vec<WebSearchRes>,
) -> Result<Vec<RerankedWebSearchRes>, String> {
    if documents.is_empty() {
        return Ok(vec![]);
    }

    let api_key = load_web_api_key(&app)?;

    let documents_as_text: Vec<String> = documents
        .iter()
        .map(|doc| {
            let s = if doc.summary.trim().is_empty() {
                &doc.snippet
            } else {
                &doc.summary
            };
            format!("{}. {}", doc.name, s)
        })
        .collect();

    let body = serde_json::json!({
        "model": "gte-rerank",
        "query": query,
        "documents": documents_as_text,
        "top_n": 3,
        "return_documents": true
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{DOMAIN}{RERANK_URL}"))
        .bearer_auth(api_key)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Rerank 请求失败: {e}"))?;

    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(format!("Rerank HTTP {}: {}", status, text));
    }

    let data: Value = serde_json::from_str(&text).map_err(|e| format!("Rerank 解析失败: {e}"))?;
    if data["code"].as_i64() != Some(200) {
        return Err(format!("Rerank 业务错误: {}", text));
    }

    let results = data["data"]["results"]
        .as_array()
        .cloned()
        .unwrap_or_default();

    let mut out = Vec::with_capacity(results.len());
    for r in results {
        let index = r["index"].as_u64().unwrap_or(0) as usize;
        let score = r["relevance_score"].as_f64().unwrap_or(0.0);

        if let Some(doc) = documents.get(index).cloned() {
            out.push(RerankedWebSearchRes {
                index,
                document: doc,
                relevance_score: score,
            });
        }
    }

    Ok(out)
}
