use serde::de::DeserializeOwned;
use tauri::{
    plugin::{PluginApi, PluginHandle},
    AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_secure_storage);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> crate::Result<SecureStorage<R>> {
    #[cfg(target_os = "android")]
    let handle = api.register_android_plugin("com.plugin.secure_storage", "SecureStoragePlugin")?;
    #[cfg(target_os = "ios")]
    let handle = api.register_ios_plugin(init_plugin_secure_storage)?;
    Ok(SecureStorage(handle))
}

/// Access to the secure-storage APIs.
pub struct SecureStorage<R: Runtime>(PluginHandle<R>);

impl<R: Runtime> SecureStorage<R> {
    pub fn set(&self, payload: SetRequest) -> crate::Result<SetResponse> {
        self.0.run_mobile_plugin("set", payload).map_err(Into::into)
    }

    pub fn get(&self, payload: GetRequest) -> crate::Result<GetResponse> {
        self.0.run_mobile_plugin("get", payload).map_err(Into::into)
    }

    pub fn delete(&self, payload: DeleteRequest) -> crate::Result<DeleteResponse> {
        self.0
            .run_mobile_plugin("delete", payload)
            .map_err(Into::into)
    }
}
