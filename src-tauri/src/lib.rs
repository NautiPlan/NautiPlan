mod commands;

#[tauri::command]
async fn aliyun_image(
    app: tauri::AppHandle,
    images: Vec<commands::aliyun_image::FileData>,
) -> Result<String, String> {
    commands::aliyun_image::call_image_gpt(app, images).await
}

#[tauri::command]
async fn aliyun_audio(
    app: tauri::AppHandle,
    audios: Vec<commands::aliyun_audio::FileData>,
) -> Result<String, String> {
    commands::aliyun_audio::call_audio_gpt(app, audios).await
}

#[tauri::command]
async fn aliyun_gpt(app: tauri::AppHandle, prompt: String) -> Result<String, String> {
    commands::aliyun_gpt::call_gpt(app, prompt).await
}

#[tauri::command]
async fn aliyun_report(app: tauri::AppHandle, prompt: String) -> Result<String, String> {
    commands::aliyun_report::call_report_gpt(app, prompt).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_secure_storage::init())
        .invoke_handler(tauri::generate_handler![
            aliyun_image,
            aliyun_audio,
            aliyun_gpt,
            aliyun_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
