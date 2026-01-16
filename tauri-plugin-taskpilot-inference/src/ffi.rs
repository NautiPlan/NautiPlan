use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_float, c_int, c_void};

// ============================================================================
// C API 函数声明
// ============================================================================

extern "C" {
    // --- Common ---
    pub fn taskpilot_free_string(str: *mut c_char);

    // --- LLM API ---
    pub fn taskpilot_model_init(config_path: *const c_char) -> *mut c_void;
    pub fn taskpilot_model_release(model: *mut c_void);
    pub fn taskpilot_model_response(model: *mut c_void, query: *const c_char) -> *mut c_char;
    pub fn taskpilot_model_response_stream(
        model: *mut c_void,
        query: *const c_char,
        callback: Option<extern "C" fn(*const c_char, *mut c_void)>,
        user_data: *mut c_void,
    );
    pub fn taskpilot_api_server_start(model: *mut c_void, port: c_int) -> c_int;
    pub fn taskpilot_get_server_api_url(port: c_int) -> *const c_char;

    // --- Embedding API ---
    pub fn taskpilot_embedding_init(config_path: *const c_char) -> *mut c_void;
    pub fn taskpilot_embedding_release(embedding: *mut c_void);
    pub fn taskpilot_embedding_encode(
        embedding: *mut c_void,
        text: *const c_char,
        out_vec: *mut c_float,
        out_size: *mut c_int,
    ) -> c_int;

    // --- RAG API ---
    pub fn taskpilot_rag_init(embedding: *mut c_void, db_path: *const c_char) -> *mut c_void;
    pub fn taskpilot_rag_release(rag: *mut c_void);
    pub fn taskpilot_rag_add_document(
        rag: *mut c_void,
        text: *const c_char,
        chunk_size: c_int,
        chunk_overlap: c_int,
    );
    pub fn taskpilot_rag_clear(rag: *mut c_void);
    pub fn taskpilot_rag_retrieve(
        rag: *mut c_void,
        query: *const c_char,
        top_k: c_int,
    ) -> *mut c_char;
}

// ============================================================================
// 安全包装器
// ============================================================================

/// 将 Rust 字符串转换为 CString，失败返回 None
#[inline]
pub fn to_cstring(s: &str) -> Option<CString> {
    CString::new(s).ok()
}

/// 从 C 字符串指针读取并释放，返回 Rust String
///
/// # Safety
/// 调用者需确保指针有效且由 taskpilot C API 分配
pub unsafe fn consume_c_string(ptr: *mut c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }
    let s = CStr::from_ptr(ptr).to_string_lossy().into_owned();
    taskpilot_free_string(ptr);
    Some(s)
}

/// 从 C 字符串指针读取（不释放），返回 Rust String
///
/// # Safety
/// 调用者需确保指针有效
pub unsafe fn read_c_string(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }
    Some(CStr::from_ptr(ptr).to_string_lossy().into_owned())
}

// ============================================================================
// LLM 安全接口
// ============================================================================

/// 初始化 LLM 模型
pub fn llm_init(config_path: &str) -> Option<*mut c_void> {
    let c_path = to_cstring(config_path)?;
    let ptr = unsafe { taskpilot_model_init(c_path.as_ptr()) };
    if ptr.is_null() {
        None
    } else {
        Some(ptr)
    }
}

/// 释放 LLM 模型
///
/// # Safety
/// 调用者需确保指针有效
pub unsafe fn llm_release(model: *mut c_void) {
    if !model.is_null() {
        taskpilot_model_release(model);
    }
}

/// 非流式推理
///
/// # Safety
/// 调用者需确保 model 指针有效
pub unsafe fn llm_response(model: *mut c_void, query: &str) -> Option<String> {
    let c_query = to_cstring(query)?;
    let ptr = taskpilot_model_response(model, c_query.as_ptr());
    consume_c_string(ptr)
}

/// 流式推理回调类型
pub type StreamCallback = extern "C" fn(*const c_char, *mut c_void);

/// 流式推理
///
/// # Safety
/// 调用者需确保 model 指针有效，callback 和 user_data 在调用期间保持有效
pub unsafe fn llm_response_stream(
    model: *mut c_void,
    query: &str,
    callback: StreamCallback,
    user_data: *mut c_void,
) -> bool {
    if let Some(c_query) = to_cstring(query) {
        taskpilot_model_response_stream(model, c_query.as_ptr(), Some(callback), user_data);
        true
    } else {
        false
    }
}

/// 启动 API 服务器（阻塞）
///
/// # Safety
/// 调用者需确保 model 指针有效
pub unsafe fn llm_server_start(model: *mut c_void, port: i32) -> i32 {
    taskpilot_api_server_start(model, port as c_int)
}

/// 获取服务器 API URL
pub fn llm_server_url(port: i32) -> String {
    unsafe {
        let ptr = taskpilot_get_server_api_url(port as c_int);
        read_c_string(ptr).unwrap_or_default()
    }
}

// ============================================================================
// Embedding 安全接口
// ============================================================================

/// 初始化 Embedding 模型
pub fn embedding_init(config_path: &str) -> Option<*mut c_void> {
    let c_path = to_cstring(config_path)?;
    let ptr = unsafe { taskpilot_embedding_init(c_path.as_ptr()) };
    if ptr.is_null() {
        None
    } else {
        Some(ptr)
    }
}

/// 释放 Embedding 模型
///
/// # Safety
/// 调用者需确保指针有效
pub unsafe fn embedding_release(embedding: *mut c_void) {
    if !embedding.is_null() {
        taskpilot_embedding_release(embedding);
    }
}

/// 文本向量化
///
/// # Safety
/// 调用者需确保 embedding 指针有效
pub unsafe fn embedding_encode(embedding: *mut c_void, text: &str) -> Option<Vec<f32>> {
    let c_text = to_cstring(text)?;

    // 先用较大缓冲区尝试
    let mut buffer = vec![0.0f32; 4096];
    let mut size: c_int = buffer.len() as c_int;

    let ret =
        taskpilot_embedding_encode(embedding, c_text.as_ptr(), buffer.as_mut_ptr(), &mut size);

    if ret == 0 && size > 0 {
        buffer.truncate(size as usize);
        Some(buffer)
    } else if ret == -4 && size > 0 {
        // 缓冲区太小，重新分配
        buffer.resize(size as usize, 0.0);
        let ret =
            taskpilot_embedding_encode(embedding, c_text.as_ptr(), buffer.as_mut_ptr(), &mut size);
        if ret == 0 {
            Some(buffer)
        } else {
            None
        }
    } else {
        None
    }
}

// ============================================================================
// RAG 安全接口
// ============================================================================

/// 初始化 RAG
///
/// # Safety
/// 调用者需确保 embedding 指针有效
pub unsafe fn rag_init(embedding: *mut c_void, db_path: &str) -> Option<*mut c_void> {
    let c_path = to_cstring(db_path)?;
    let ptr = taskpilot_rag_init(embedding, c_path.as_ptr());
    if ptr.is_null() {
        None
    } else {
        Some(ptr)
    }
}

/// 释放 RAG
///
/// # Safety
/// 调用者需确保指针有效
pub unsafe fn rag_release(rag: *mut c_void) {
    if !rag.is_null() {
        taskpilot_rag_release(rag);
    }
}

/// 添加文档到 RAG
///
/// # Safety
/// 调用者需确保 rag 指针有效
pub unsafe fn rag_add_document(
    rag: *mut c_void,
    text: &str,
    chunk_size: i32,
    chunk_overlap: i32,
) -> bool {
    if let Some(c_text) = to_cstring(text) {
        taskpilot_rag_add_document(
            rag,
            c_text.as_ptr(),
            chunk_size as c_int,
            chunk_overlap as c_int,
        );
        true
    } else {
        false
    }
}

/// 清空 RAG 知识库
///
/// # Safety
/// 调用者需确保 rag 指针有效
pub unsafe fn rag_clear(rag: *mut c_void) {
    taskpilot_rag_clear(rag);
}

/// RAG 检索
///
/// # Safety
/// 调用者需确保 rag 指针有效
pub unsafe fn rag_retrieve(rag: *mut c_void, query: &str, top_k: i32) -> Option<String> {
    let c_query = to_cstring(query)?;
    let ptr = taskpilot_rag_retrieve(rag, c_query.as_ptr(), top_k as c_int);
    consume_c_string(ptr)
}
