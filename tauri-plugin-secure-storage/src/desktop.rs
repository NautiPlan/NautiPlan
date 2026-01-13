use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

const SERVICE: &str = "taskPilot";

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<SecureStorage<R>> {
    Ok(SecureStorage(app.clone()))
}

/// Access to the secure-storage APIs (desktop).
pub struct SecureStorage<R: Runtime>(AppHandle<R>);

impl<R: Runtime> SecureStorage<R> {
    pub fn set(&self, payload: SetRequest) -> crate::Result<SetResponse> {
        let entry = keyring::Entry::new(SERVICE, &payload.key)
            .map_err(|e| crate::Error::Other(e.to_string()))?;

        entry
            .set_password(&payload.value)
            .map_err(|e| crate::Error::Other(e.to_string()))?;

        Ok(SetResponse {})
    }

    pub fn get(&self, payload: GetRequest) -> crate::Result<GetResponse> {
        let entry = keyring::Entry::new(SERVICE, &payload.key)
            .map_err(|e| crate::Error::Other(e.to_string()))?;

        match entry.get_password() {
            Ok(v) => Ok(GetResponse { value: Some(v) }),
            Err(keyring::Error::NoEntry) => Ok(GetResponse { value: None }),
            Err(e) => Err(crate::Error::Other(e.to_string())),
        }
    }

    pub fn delete(&self, payload: DeleteRequest) -> crate::Result<DeleteResponse> {
        let entry = keyring::Entry::new(SERVICE, &payload.key)
            .map_err(|e| crate::Error::Other(e.to_string()))?;

        match entry.delete_password() {
            Ok(_) => Ok(DeleteResponse {}),
            Err(keyring::Error::NoEntry) => Ok(DeleteResponse {}),
            Err(e) => Err(crate::Error::Other(e.to_string())),
        }
    }
}
