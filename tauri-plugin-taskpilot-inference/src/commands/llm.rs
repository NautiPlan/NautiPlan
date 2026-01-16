//! LLM 相关命令

use std::thread;

use serde::{Deserialize, Serialize};
use tauri::{command, ipc::Channel, AppHandle, Runtime, State};

use crate::ffi;
use crate::state::TaskPilotState;
use crate::stream::{run_stream_inference, StreamToken};
use crate::Result;

// ============================================================================
// 请求/响应类型
// ============================================================================

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmInitRequest {
    /// 模型配置文件路径（JSON）
    pub config_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmChatRequest {
    /// 用户查询/提示词
    pub query: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmChatResponse {
    /// 模型回复
    pub response: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmServerRequest {
    /// 服务器端口
    pub port: i32,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmServerUrlResponse {
    /// API 基础 URL
    pub url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LlmStatusResponse {
    /// LLM 是否已初始化
    pub initialized: bool,
}

// ============================================================================
// 命令实现
// ============================================================================

/// 初始化 LLM 模型
#[command]
pub async fn llm_init(state: State<'_, TaskPilotState>, payload: LlmInitRequest) -> Result<()> {
    state.init_llm(&payload.config_path)
}

/// 释放 LLM 模型
#[command]
pub async fn llm_release(state: State<'_, TaskPilotState>) -> Result<()> {
    state.release_llm();
    Ok(())
}

/// 非流式对话
#[command]
pub async fn llm_chat(
    state: State<'_, TaskPilotState>,
    payload: LlmChatRequest,
) -> Result<LlmChatResponse> {
    let response = state.llm_chat(&payload.query)?;
    Ok(LlmChatResponse { response })
}

/// 流式对话（通过 Channel 推送 token）
#[command]
pub async fn llm_chat_stream(
    state: State<'_, TaskPilotState>,
    payload: LlmChatRequest,
    on_token: Channel<StreamToken>,
) -> Result<()> {
    let core = state.0.lock().unwrap();
    let llm_ptr = core.llm_ptr().ok_or(crate::Error::LlmNotInitialized)?;
    let query = payload.query.clone();
    drop(core);

    // 在当前线程执行流式推理
    run_stream_inference(llm_ptr, &query, on_token)
}

/// 启动本地 API 服务器（后台线程，非阻塞返回）
#[command]
pub async fn llm_server_start<R: Runtime>(
    _app: AppHandle<R>,
    state: State<'_, TaskPilotState>,
    payload: LlmServerRequest,
) -> Result<LlmServerUrlResponse> {
    let core = state.0.lock().unwrap();
    let llm_ptr = core.llm_ptr().ok_or(crate::Error::LlmNotInitialized)?;
    drop(core);

    let port = payload.port;
    let url = ffi::llm_server_url(port);

    // 将裸指针包装为可跨线程发送的类型
    let llm_ptr_usize = llm_ptr as usize;

    // 在后台线程启动服务器（阻塞调用）
    thread::spawn(move || {
        let ptr = llm_ptr_usize as *mut std::os::raw::c_void;
        unsafe {
            ffi::llm_server_start(ptr, port);
        }
    });

    Ok(LlmServerUrlResponse { url })
}

/// 获取服务器 API URL
#[command]
pub async fn llm_server_url(payload: LlmServerRequest) -> Result<LlmServerUrlResponse> {
    let url = ffi::llm_server_url(payload.port);
    Ok(LlmServerUrlResponse { url })
}

/// 查询 LLM 初始化状态
#[command]
pub async fn llm_status(state: State<'_, TaskPilotState>) -> Result<LlmStatusResponse> {
    Ok(LlmStatusResponse {
        initialized: state.is_llm_initialized(),
    })
}
