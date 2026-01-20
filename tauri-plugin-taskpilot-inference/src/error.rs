use serde::{ser::Serializer, Serialize};

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[cfg(mobile)]
    #[error(transparent)]
    PluginInvoke(#[from] tauri::plugin::mobile::PluginInvokeError),

    // ========== TaskPilot 推理核心错误 ==========
    #[error("LLM 模型未初始化")]
    LlmNotInitialized,

    #[error("LLM 模型初始化失败: {0}")]
    LlmInitFailed(String),

    #[error("LLM 推理失败")]
    LlmInferenceFailed,

    #[error("LLM 服务器启动失败: code={0}")]
    LlmServerFailed(i32),

    #[error("Embedding 模型未初始化")]
    EmbeddingNotInitialized,

    #[error("Embedding 模型初始化失败: {0}")]
    EmbeddingInitFailed(String),

    #[error("Embedding 编码失败")]
    EmbeddingEncodeFailed,

    #[error("RAG 未初始化")]
    RagNotInitialized,

    #[error("RAG 初始化失败: {0}")]
    RagInitFailed(String),

    #[error("RAG 检索失败")]
    RagRetrieveFailed,

    #[error("无效参数: {0}")]
    InvalidArgument(String),

    #[error("资源已被初始化")]
    AlreadyInitialized,

    #[error("下载失败: {0}")]
    DownloadError(String),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
