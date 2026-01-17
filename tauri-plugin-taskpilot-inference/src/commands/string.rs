//! 字符串相关命令

use serde::Deserialize;
use tauri::command;

use crate::Result;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StringFreeRequest {
    /// C 侧分配并返回的字符串指针地址（由 taskpilot_free_string 释放）
    pub ptr: u64,
}

#[command]
pub async fn string_free(payload: StringFreeRequest) -> Result<()> {
    if payload.ptr == 0 {
        return Ok(());
    }

    let ptr = payload.ptr as usize as *mut std::os::raw::c_char;
    unsafe {
        crate::ffi::taskpilot_free_string(ptr);
    }
    Ok(())
}
