use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub use models::*;

#[cfg(target_os = "android")]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

/// Android 下用 mobile::SecureStorage；非 Android 下提供一个空实现，保证可编译。
#[cfg(target_os = "android")]
pub use mobile::SecureStorage;

#[cfg(not(target_os = "android"))]
pub struct SecureStorage<R: Runtime>(std::marker::PhantomData<fn() -> R>);

#[cfg(not(target_os = "android"))]
impl<R: Runtime> SecureStorage<R> {
    pub fn new() -> Self {
        Self(std::marker::PhantomData)
    }

    pub fn set(&self, _payload: SetRequest) -> crate::Result<SetResponse> {
        Err(crate::Error::Other(
            "secure_storage 仅在 Android 实现".into(),
        ))
    }

    pub fn get(&self, _payload: GetRequest) -> crate::Result<GetResponse> {
        Ok(GetResponse { value: None })
    }

    pub fn delete(&self, _payload: DeleteRequest) -> crate::Result<DeleteResponse> {
        Err(crate::Error::Other(
            "secure_storage 仅在 Android 实现".into(),
        ))
    }
}

/// Extensions to access the secure-storage APIs.
pub trait SecureStorageExt<R: Runtime> {
    fn secure_storage(&self) -> &SecureStorage<R>;
}

impl<R: Runtime, T: Manager<R>> crate::SecureStorageExt<R> for T {
    fn secure_storage(&self) -> &SecureStorage<R> {
        self.state::<SecureStorage<R>>().inner()
    }
}

/// Initializes the plugin.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("secure-storage")
        .invoke_handler(tauri::generate_handler![
            commands::set,
            commands::get,
            commands::delete
        ])
        .setup(|app, api| {
            #[cfg(target_os = "android")]
            {
                let secure_storage = mobile::init(app, api)?;
                app.manage(secure_storage);
            }

            #[cfg(not(target_os = "android"))]
            {
                let _ = api;
                app.manage(SecureStorage::<R>::new());
            }

            Ok(())
        })
        .build()
}
