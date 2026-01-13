pub mod aliyun_audio;
pub mod aliyun_gpt;
pub mod aliyun_image;
pub mod aliyun_report;

use tauri_plugin_secure_storage::{GetRequest, SecureStorageExt};

pub fn load_ali_api_key(app: &tauri::AppHandle) -> Result<String, String> {
    let resp = app
        .secure_storage()
        .get(GetRequest {
            key: "ALIAPI_KEY".to_string(),
        })
        .map_err(|e| e.to_string())?;

    resp.value
        .filter(|v| !v.trim().is_empty())
        .ok_or_else(|| "未设置 ALIAPI_KEY（请先在 App 内保存 Key）".to_string())
}
