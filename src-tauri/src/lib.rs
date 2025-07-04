use once_cell::sync::Lazy;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_void};
use std::sync::{Arc, Condvar, Mutex};
use std::time::Duration;

#[derive(Debug)]
struct BluelmHandle(*mut c_void);

unsafe impl Send for BluelmHandle {}
unsafe impl Sync for BluelmHandle {}

impl BluelmHandle {
    fn new(ptr: *mut c_void) -> Option<Self> {
        if ptr.is_null() {
            None
        } else {
            Some(Self(ptr))
        }
    }

    fn as_ptr(&self) -> *mut c_void {
        self.0
    }
}

impl Drop for BluelmHandle {
    fn drop(&mut self) {
        unsafe {
            bluelm_reset(self.0);
            bluelm_free(self.0);
        }
    }
}

static BLUELM_INSTANCE: Lazy<Arc<Mutex<Option<BluelmHandle>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

#[link(name = "bluelm", kind = "dylib")]
extern "C" {
    // 新增日志设置函数
    pub fn bluelm_set_log_level(level: i32);

    // 原有函数保持不变
    pub fn bluelm_create() -> *mut c_void;
    pub fn bluelm_free(handle: *mut c_void);
    pub fn bluelm_init(handle: *mut c_void) -> i32;
    pub fn bluelm_forward(
        handle: *mut c_void,
        prompt: *const c_char,
        callback: extern "C" fn(*const c_char, *mut c_void),
        user_data: *mut c_void,
    ) -> i32;
    pub fn bluelm_reset(handle: *mut c_void) -> i32;
}

#[tauri::command]
fn init_bluelm() -> Result<String, String> {
    unsafe {
        // 设置日志级别为DEBUG(1)
        bluelm_set_log_level(1);
    }
    let mut instance = BLUELM_INSTANCE.lock().unwrap();
    if instance.is_some() {
        return Ok("Already initialized".to_string());
    }

    unsafe {
        let handle = bluelm_create();
        let bluelm_handle = BluelmHandle::new(handle).ok_or("bluelm_create failed")?;

        if bluelm_init(handle) != 0 {
            return Err("bluelm_init failed".to_string());
        }

        *instance = Some(bluelm_handle);
        Ok("Initialized".to_string())
    }
}

#[tauri::command]
async fn use_bluelm(prompt: String) -> Result<String, String> {
    // 确保已初始化
    init_bluelm().map_err(|e| e.to_string())?;

    let handle = {
        let instance = BLUELM_INSTANCE.lock().unwrap();
        match instance.as_ref() {
            Some(h) => h.as_ptr(),
            None => return Err("bluelm not initialized".to_string()),
        }
    };

    let result_data = Arc::new((Mutex::new((String::new(), false)), Condvar::new()));

    extern "C" fn rust_callback(result_ptr: *const c_char, user_data: *mut c_void) {
        let (mutex, cvar) = unsafe { &*(user_data as *const (Mutex<(String, bool)>, Condvar)) };

        let c_str = unsafe { CStr::from_ptr(result_ptr) };
        if let Ok(s) = c_str.to_str() {
            let content = s.to_string();

            let mut data = mutex.lock().unwrap();

            if content.contains("[end of text]") {
                if let Some(pos) = content.find("[end of text]") {
                    let before_end = &content[..pos];
                    if !before_end.is_empty() {
                        data.0.push_str(before_end);
                    }
                }
                data.1 = true; // 设置完成标志
                println!("检测到结束标记，流接收完成");
                cvar.notify_one(); // 唤醒等待的线程
            } else {
                // 累积内容
                data.0.push_str(&content);
                println!("累积内容长度: {}", data.0.len());
            }
        }
    }

    unsafe {
        // 重置状态
        bluelm_reset(handle);

        let c_prompt = CString::new(prompt).unwrap();
        let user_data = Arc::as_ptr(&result_data) as *mut c_void;

        if bluelm_forward(handle, c_prompt.as_ptr(), rust_callback, user_data) != 0 {
            return Err("bluelm_forward failed".to_string());
        }

        let (mutex, cvar) = &*result_data;
        let mut data = mutex.lock().unwrap();
        while !data.1 {
            let timeout = Duration::from_secs(60); // 减少超时时间到60秒
            let (new_data, timeout_result) = cvar.wait_timeout(data, timeout).unwrap();
            data = new_data;

            if timeout_result.timed_out() {
                println!("等待超时，返回已接收的内容，长度: {}", data.0.len());
                if data.0.is_empty() {
                    return Err("Timeout: No content received from bluelm".to_string());
                } else {
                    return Ok(data.0.clone());
                }
            }
        }

        Ok(data.0.clone())
    }
}

#[tauri::command]
fn release_bluelm() -> String {
    let mut instance = BLUELM_INSTANCE.lock().unwrap();
    if let Some(_handle) = instance.take() {
        "bluelm released".to_string()
    } else {
        "bluelm not initialized".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            init_bluelm,
            use_bluelm,
            release_bluelm
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
