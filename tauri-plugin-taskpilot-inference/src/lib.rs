use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;
mod error;
mod ffi;
mod state;
mod stream;

pub use error::{Error, Result};
pub use state::TaskPilotState;
pub use stream::StreamToken;

/// 初始化插件
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("taskpilot-inference")
        .invoke_handler(tauri::generate_handler![
            // LLM 命令
            commands::llm_init,
            commands::llm_release,
            commands::llm_chat,
            commands::llm_chat_stream,
            commands::llm_server_start,
            commands::llm_server_url,
            commands::llm_status,
            // Embedding 命令
            commands::embedding_init,
            commands::embedding_release,
            commands::embedding_encode,
            commands::embedding_status,
            // RAG 命令
            commands::rag_init,
            commands::rag_release,
            commands::rag_add_document,
            commands::rag_clear,
            commands::rag_retrieve,
            commands::rag_status,
        ])
        .setup(|app, _api| {
            // 注册全局状态
            app.manage(TaskPilotState::new());
            Ok(())
        })
        .build()
}
