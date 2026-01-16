use std::os::raw::c_void;
use std::sync::Mutex;

use crate::ffi;

/// 核心状态：存储所有句柄指针
#[derive(Default)]
pub struct CoreState {
    /// LLM 模型句柄
    pub llm: Option<usize>,
    /// Embedding 模型句柄
    pub embedding: Option<usize>,
    /// RAG 管理器句柄
    pub rag: Option<usize>,
}

impl CoreState {
    /// 获取 LLM 句柄指针
    pub fn llm_ptr(&self) -> Option<*mut c_void> {
        self.llm.map(|p| p as *mut c_void)
    }

    /// 获取 Embedding 句柄指针
    pub fn embedding_ptr(&self) -> Option<*mut c_void> {
        self.embedding.map(|p| p as *mut c_void)
    }

    /// 获取 RAG 句柄指针
    pub fn rag_ptr(&self) -> Option<*mut c_void> {
        self.rag.map(|p| p as *mut c_void)
    }
}

/// 线程安全的状态包装器
pub struct TaskPilotState(pub Mutex<CoreState>);

impl Default for TaskPilotState {
    fn default() -> Self {
        Self(Mutex::new(CoreState::default()))
    }
}

impl TaskPilotState {
    pub fn new() -> Self {
        Self::default()
    }

    // ========== LLM 操作 ==========

    /// 初始化 LLM 模型
    pub fn init_llm(&self, config_path: &str) -> crate::Result<()> {
        let mut state = self.0.lock().unwrap();
        if state.llm.is_some() {
            return Err(crate::Error::AlreadyInitialized);
        }

        match ffi::llm_init(config_path) {
            Some(ptr) => {
                state.llm = Some(ptr as usize);
                Ok(())
            }
            None => Err(crate::Error::LlmInitFailed(config_path.to_string())),
        }
    }

    /// 释放 LLM 模型
    pub fn release_llm(&self) {
        let mut state = self.0.lock().unwrap();
        if let Some(ptr) = state.llm.take() {
            unsafe { ffi::llm_release(ptr as *mut c_void) };
        }
    }

    /// LLM 是否已初始化
    pub fn is_llm_initialized(&self) -> bool {
        self.0.lock().unwrap().llm.is_some()
    }

    /// 非流式推理
    pub fn llm_chat(&self, query: &str) -> crate::Result<String> {
        let state = self.0.lock().unwrap();
        let ptr = state.llm_ptr().ok_or(crate::Error::LlmNotInitialized)?;

        unsafe { ffi::llm_response(ptr, query).ok_or(crate::Error::LlmInferenceFailed) }
    }

    /// 启动 API 服务器（会阻塞当前线程）
    pub fn llm_server_start(&self, port: i32) -> crate::Result<()> {
        let state = self.0.lock().unwrap();
        let ptr = state.llm_ptr().ok_or(crate::Error::LlmNotInitialized)?;
        drop(state); // 释放锁，因为服务器会阻塞

        let ret = unsafe { ffi::llm_server_start(ptr, port) };
        if ret == 0 {
            Ok(())
        } else {
            Err(crate::Error::LlmServerFailed(ret))
        }
    }

    // ========== Embedding 操作 ==========

    /// 初始化 Embedding 模型
    pub fn init_embedding(&self, config_path: &str) -> crate::Result<()> {
        let mut state = self.0.lock().unwrap();
        if state.embedding.is_some() {
            return Err(crate::Error::AlreadyInitialized);
        }

        match ffi::embedding_init(config_path) {
            Some(ptr) => {
                state.embedding = Some(ptr as usize);
                Ok(())
            }
            None => Err(crate::Error::EmbeddingInitFailed(config_path.to_string())),
        }
    }

    /// 释放 Embedding 模型
    pub fn release_embedding(&self) {
        let mut state = self.0.lock().unwrap();
        if let Some(ptr) = state.embedding.take() {
            unsafe { ffi::embedding_release(ptr as *mut c_void) };
        }
    }

    /// Embedding 是否已初始化
    pub fn is_embedding_initialized(&self) -> bool {
        self.0.lock().unwrap().embedding.is_some()
    }

    /// 文本向量化
    pub fn embedding_encode(&self, text: &str) -> crate::Result<Vec<f32>> {
        let state = self.0.lock().unwrap();
        let ptr = state
            .embedding_ptr()
            .ok_or(crate::Error::EmbeddingNotInitialized)?;

        unsafe { ffi::embedding_encode(ptr, text).ok_or(crate::Error::EmbeddingEncodeFailed) }
    }

    // ========== RAG 操作 ==========

    /// 初始化 RAG（需要先初始化 Embedding）
    pub fn init_rag(&self, db_path: &str) -> crate::Result<()> {
        let mut state = self.0.lock().unwrap();

        if state.rag.is_some() {
            return Err(crate::Error::AlreadyInitialized);
        }

        let emb_ptr = state
            .embedding_ptr()
            .ok_or(crate::Error::EmbeddingNotInitialized)?;

        unsafe {
            match ffi::rag_init(emb_ptr, db_path) {
                Some(ptr) => {
                    state.rag = Some(ptr as usize);
                    Ok(())
                }
                None => Err(crate::Error::RagInitFailed(db_path.to_string())),
            }
        }
    }

    /// 释放 RAG
    pub fn release_rag(&self) {
        let mut state = self.0.lock().unwrap();
        if let Some(ptr) = state.rag.take() {
            unsafe { ffi::rag_release(ptr as *mut c_void) };
        }
    }

    /// RAG 是否已初始化
    pub fn is_rag_initialized(&self) -> bool {
        self.0.lock().unwrap().rag.is_some()
    }

    /// 添加文档到 RAG
    pub fn rag_add_document(
        &self,
        text: &str,
        chunk_size: i32,
        chunk_overlap: i32,
    ) -> crate::Result<()> {
        let state = self.0.lock().unwrap();
        let ptr = state.rag_ptr().ok_or(crate::Error::RagNotInitialized)?;

        unsafe {
            if ffi::rag_add_document(ptr, text, chunk_size, chunk_overlap) {
                Ok(())
            } else {
                Err(crate::Error::InvalidArgument(
                    "text contains null byte".to_string(),
                ))
            }
        }
    }

    /// 清空 RAG 知识库
    pub fn rag_clear(&self) -> crate::Result<()> {
        let state = self.0.lock().unwrap();
        let ptr = state.rag_ptr().ok_or(crate::Error::RagNotInitialized)?;

        unsafe {
            ffi::rag_clear(ptr);
            Ok(())
        }
    }

    /// RAG 检索
    pub fn rag_retrieve(&self, query: &str, top_k: i32) -> crate::Result<String> {
        let state = self.0.lock().unwrap();
        let ptr = state.rag_ptr().ok_or(crate::Error::RagNotInitialized)?;

        unsafe { ffi::rag_retrieve(ptr, query, top_k).ok_or(crate::Error::RagRetrieveFailed) }
    }

    // ========== 资源释放 ==========

    /// 释放所有资源
    pub fn release_all(&self) {
        self.release_rag();
        self.release_embedding();
        self.release_llm();
    }
}

impl Drop for TaskPilotState {
    fn drop(&mut self) {
        self.release_all();
    }
}
