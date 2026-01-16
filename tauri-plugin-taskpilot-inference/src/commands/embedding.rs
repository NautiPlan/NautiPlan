use serde::{Deserialize, Serialize};
use tauri::{command, State};

use crate::state::TaskPilotState;
use crate::Result;

// ============================================================================
// 请求/响应类型
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmbeddingInitRequest {
    /// Embedding 配置文件路径
    pub config_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmbeddingEncodeRequest {
    /// 要编码的文本
    pub text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmbeddingEncodeResponse {
    /// 向量
    pub vector: Vec<f32>,
    /// 向量维度
    pub dimension: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EmbeddingStatusResponse {
    /// Embedding 是否已初始化
    pub initialized: bool,
}

// ============================================================================
// 命令实现
// ============================================================================

/// 初始化 Embedding 模型
#[command]
pub async fn embedding_init(
    state: State<'_, TaskPilotState>,
    payload: EmbeddingInitRequest,
) -> Result<()> {
    state.init_embedding(&payload.config_path)
}

/// 释放 Embedding 模型
#[command]
pub async fn embedding_release(state: State<'_, TaskPilotState>) -> Result<()> {
    state.release_embedding();
    Ok(())
}

/// 文本向量化
#[command]
pub async fn embedding_encode(
    state: State<'_, TaskPilotState>,
    payload: EmbeddingEncodeRequest,
) -> Result<EmbeddingEncodeResponse> {
    let vector = state.embedding_encode(&payload.text)?;
    let dimension = vector.len();
    Ok(EmbeddingEncodeResponse { vector, dimension })
}

/// 查询 Embedding 初始化状态
#[command]
pub async fn embedding_status(state: State<'_, TaskPilotState>) -> Result<EmbeddingStatusResponse> {
    Ok(EmbeddingStatusResponse {
        initialized: state.is_embedding_initialized(),
    })
}
