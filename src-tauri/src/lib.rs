mod commands;

#[tauri::command]
async fn aliyun_image(
    images: Vec<commands::aliyun_image::ImageData>,
    api_key: String,
) -> Result<String, String> {
    commands::aliyun_image::call_image_gpt(images, api_key).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![aliyun_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
