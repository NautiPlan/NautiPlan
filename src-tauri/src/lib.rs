mod commands;

#[tauri::command]
async fn aliyun_image(
    images: Vec<commands::aliyun_image::FileData>,
    api_key: String,
) -> Result<String, String> {
    commands::aliyun_image::call_image_gpt(images, api_key).await
}

#[tauri::command]
async fn aliyun_audio(
    audios: Vec<commands::aliyun_audio::FileData>,
    api_key: String,
) -> Result<String, String> {
    commands::aliyun_audio::call_audio_gpt(audios, api_key).await
}

#[tauri::command]
async fn aliyun_gpt(prompt: String, api_key: String) -> Result<String, String> {
    commands::aliyun_gpt::call_gpt(prompt, api_key).await
}

#[tauri::command]
async fn aliyun_report(prompt: String, api_key: String) -> Result<String, String> {
    commands::aliyun_report::call_report_gpt(prompt, api_key).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            aliyun_image,
            aliyun_audio,
            aliyun_gpt,
            aliyun_report
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
