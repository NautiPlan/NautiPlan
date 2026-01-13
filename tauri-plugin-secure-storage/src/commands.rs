use tauri::{command, AppHandle, Runtime};

use crate::models::*;
use crate::Result;
use crate::SecureStorageExt;

#[command]
pub(crate) async fn set<R: Runtime>(
    app: AppHandle<R>,
    key: String,
    value: String,
) -> Result<SetResponse> {
    app.secure_storage().set(SetRequest { key, value })
}

#[command]
pub(crate) async fn get<R: Runtime>(app: AppHandle<R>, key: String) -> Result<GetResponse> {
    app.secure_storage().get(GetRequest { key })
}

#[command]
pub(crate) async fn delete<R: Runtime>(app: AppHandle<R>, key: String) -> Result<DeleteResponse> {
    app.secure_storage().delete(DeleteRequest { key })
}
