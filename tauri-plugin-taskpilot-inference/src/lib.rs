use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime, State,
};
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_int, c_void};
use std::sync::Mutex;

// --- C API Bindings ---
extern "C" {
    fn taskpilot_free_string(str: *mut c_char);
    
    // LLM API
    fn taskpilot_model_init(config_path: *const c_char) -> *mut c_void;
    fn taskpilot_model_release(model: *mut c_void);
    fn taskpilot_model_response(model: *mut c_void, query: *const c_char) -> *mut c_char;
    
    // RAG API
    fn taskpilot_embedding_init(config_path: *const c_char) -> *mut c_void;
    fn taskpilot_embedding_release(embedding: *mut c_void);
    fn taskpilot_rag_init(embedding: *mut c_void, db_path: *const c_char) -> *mut c_void;
    fn taskpilot_rag_release(rag: *mut c_void);
    fn taskpilot_rag_retrieve(rag: *mut c_void, query: *const c_char, top_k: c_int) -> *mut c_char;
}

// --- State Management ---
#[derive(Default)]
pub struct CoreState {
    pub model: Option<usize>,
    pub embedding: Option<usize>,
    pub rag: Option<usize>,
}

pub struct TaskPilotState(pub Mutex<CoreState>);

// --- Commands ---
pub mod commands {
    use super::*;

    #[tauri::command]
    pub fn llm_init(state: State<'_, TaskPilotState>, config_path: String) -> Result<(), String> {
        let mut core = state.0.lock().unwrap();
        if core.model.is_some() {
            return Ok(());
        }

        let c_path = CString::new(config_path).map_err(|e| e.to_string())?;
        unsafe {
            let model = taskpilot_model_init(c_path.as_ptr());
            if model.is_null() {
                return Err("Failed to initialize LLM model".to_string());
            }
            core.model = Some(model as usize);
        }
        Ok(())
    }

    #[tauri::command]
    pub fn llm_chat(state: State<'_, TaskPilotState>, query: String) -> Result<String, String> {
        let core = state.0.lock().unwrap();
        let model_ptr = core.model.ok_or("LLM model not initialized")? as *mut c_void;
        
        let c_query = CString::new(query).map_err(|e| e.to_string())?;
        unsafe {
            let c_res = taskpilot_model_response(model_ptr, c_query.as_ptr());
            if c_res.is_null() {
                return Err("LLM response failed".to_string());
            }
            let res = CStr::from_ptr(c_res).to_string_lossy().into_owned();
            taskpilot_free_string(c_res);
            Ok(res)
        }
    }

    #[tauri::command]
    pub fn rag_init(state: State<'_, TaskPilotState>, embedding_config: String, db_path: String) -> Result<(), String> {
        let mut core = state.0.lock().unwrap();
        
        let c_emb_path = CString::new(embedding_config).map_err(|e| e.to_string())?;
        let c_db_path = CString::new(db_path).map_err(|e| e.to_string())?;

        unsafe {
            let emb = taskpilot_embedding_init(c_emb_path.as_ptr());
            if emb.is_null() {
                return Err("Failed to initialize Embedding".to_string());
            }
            core.embedding = Some(emb as usize);

            let rag = taskpilot_rag_init(emb, c_db_path.as_ptr());
            if rag.is_null() {
                return Err("Failed to initialize RAG".to_string());
            }
            core.rag = Some(rag as usize);
        }
        Ok(())
    }

    #[tauri::command]
    pub fn rag_retrieve(state: State<'_, TaskPilotState>, query: String, top_k: i32) -> Result<String, String> {
        let core = state.0.lock().unwrap();
        let rag_ptr = core.rag.ok_or("RAG not initialized")? as *mut c_void;

        let c_query = CString::new(query).map_err(|e| e.to_string())?;
        unsafe {
            let c_res = taskpilot_rag_retrieve(rag_ptr, c_query.as_ptr(), top_k as c_int);
            if c_res.is_null() {
                return Err("RAG retrieval failed".to_string());
            }
            let res = CStr::from_ptr(c_res).to_string_lossy().into_owned();
            taskpilot_free_string(c_res);
            Ok(res)
        }
    }

    #[tauri::command]
    pub fn llm_release(state: State<'_, TaskPilotState>) -> Result<(), String> {
        let mut core = state.0.lock().unwrap();
        if let Some(model_ptr) = core.model.take() {
            unsafe { taskpilot_model_release(model_ptr as *mut c_void) };
        }
        Ok(())
    }

    #[tauri::command]
    pub fn rag_release(state: State<'_, TaskPilotState>) -> Result<(), String> {
        let mut core = state.0.lock().unwrap();
        if let Some(rag_ptr) = core.rag.take() {
            unsafe { taskpilot_rag_release(rag_ptr as *mut c_void) };
        }
        if let Some(emb_ptr) = core.embedding.take() {
            unsafe { taskpilot_embedding_release(emb_ptr as *mut c_void) };
        }
        Ok(())
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("taskpilot-inference")
        .invoke_handler(tauri::generate_handler![
            commands::llm_init,
            commands::llm_chat,
            commands::rag_init,
            commands::rag_retrieve,
            commands::llm_release,
            commands::rag_release
        ])
        .setup(|app, _api| {
            app.manage(TaskPilotState(Mutex::new(CoreState::default())));
            Ok(())
        })
        .build()
}
