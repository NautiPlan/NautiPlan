use std::ffi::CStr;
use std::os::raw::{c_char, c_void};

use serde::Serialize;
use tauri::ipc::Channel;

use crate::ffi;

/// 流式推理的 Token 事件
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamToken {
    /// 当前 token 文本
    pub token: String,
    /// 是否为最后一个 token
    pub done: bool,
}

/// 流式回调的用户数据
struct StreamUserData {
    channel: Channel<StreamToken>,
}

/// C 回调函数：将 token 发送到 Tauri Channel
extern "C" fn stream_callback(token_ptr: *const c_char, user_data: *mut c_void) {
    if user_data.is_null() {
        return;
    }

    let data = unsafe { &*(user_data as *const StreamUserData) };

    let token = if token_ptr.is_null() {
        String::new()
    } else {
        unsafe { CStr::from_ptr(token_ptr).to_string_lossy().into_owned() }
    };

    // 发送 token 到 channel
    let _ = data.channel.send(StreamToken { token, done: false });
}

/// 执行流式推理，将结果通过 Channel 发送到前端
///
/// # Safety
/// 调用者需确保 llm_ptr 有效
pub fn run_stream_inference(
    llm_ptr: *mut c_void,
    query: &str,
    channel: Channel<StreamToken>,
) -> crate::Result<()> {
    let user_data = Box::new(StreamUserData {
        channel: channel.clone(),
    });
    let user_data_ptr = Box::into_raw(user_data) as *mut c_void;

    // 执行流式推理
    let success =
        unsafe { ffi::llm_response_stream(llm_ptr, query, stream_callback, user_data_ptr) };

    // 清理用户数据
    unsafe {
        let _ = Box::from_raw(user_data_ptr as *mut StreamUserData);
    }

    if success {
        // 发送完成信号
        let _ = channel.send(StreamToken {
            token: String::new(),
            done: true,
        });
        Ok(())
    } else {
        Err(crate::Error::LlmInferenceFailed)
    }
}
