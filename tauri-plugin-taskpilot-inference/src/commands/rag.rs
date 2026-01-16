use serde::{Deserialize, Serialize};
use tauri::{command, State};

use crate::state::TaskPilotState;
use crate::Result;

// ============================================================================
// 请求/响应类型
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RagInitRequest {
    /// SQLite 数据库路径
    pub db_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RagAddDocumentRequest {
    /// 文档文本
    pub text: String,
    /// 分块大小（字符数）
    #[serde(default = "default_chunk_size")]
    pub chunk_size: i32,
    /// 分块重叠大小
    #[serde(default = "default_chunk_overlap")]
    pub chunk_overlap: i32,
}

fn default_chunk_size() -> i32 {
    500
}

fn default_chunk_overlap() -> i32 {
    50
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RagRetrieveRequest {
    /// 查询文本
    pub query: String,
    /// 返回 Top-K 个结果
    #[serde(default = "default_top_k")]
    pub top_k: i32,
}

fn default_top_k() -> i32 {
    5
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RagRetrieveResponse {
    /// 检索到的上下文（以 \n---\n 分隔的多个片段）
    pub context: String,
    /// 片段数量
    pub count: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RagStatusResponse {
    /// RAG 是否已初始化
    pub initialized: bool,
    /// Embedding 是否已初始化（RAG 依赖）
    pub embedding_initialized: bool,
}

// ============================================================================
// 命令实现
// ============================================================================

/// 初始化 RAG（需要先初始化 Embedding）
#[command]
pub async fn rag_init(state: State<'_, TaskPilotState>, payload: RagInitRequest) -> Result<()> {
    state.init_rag(&payload.db_path)
}

/// 释放 RAG
#[command]
pub async fn rag_release(state: State<'_, TaskPilotState>) -> Result<()> {
    state.release_rag();
    Ok(())
}

/// 添加文档到 RAG 知识库
#[command]
pub async fn rag_add_document(
    state: State<'_, TaskPilotState>,
    payload: RagAddDocumentRequest,
) -> Result<()> {
    state.rag_add_document(&payload.text, payload.chunk_size, payload.chunk_overlap)
}

/// 清空 RAG 知识库
#[command]
pub async fn rag_clear(state: State<'_, TaskPilotState>) -> Result<()> {
    state.rag_clear()
}

/// RAG 检索
#[command]
pub async fn rag_retrieve(
    state: State<'_, TaskPilotState>,
    payload: RagRetrieveRequest,
) -> Result<RagRetrieveResponse> {
    let context = state.rag_retrieve(&payload.query, payload.top_k)?;
    // 计算片段数量
    let count = if context.is_empty() {
        0
    } else {
        context.matches("\n---\n").count() + 1
    };
    Ok(RagRetrieveResponse { context, count })
}

/// 查询 RAG 初始化状态
#[command]
pub async fn rag_status(state: State<'_, TaskPilotState>) -> Result<RagStatusResponse> {
    Ok(RagStatusResponse {
        initialized: state.is_rag_initialized(),
        embedding_initialized: state.is_embedding_initialized(),
    })
}
