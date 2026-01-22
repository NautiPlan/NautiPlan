# Tauri Plugin Secure Storage

[简体中文](README.zh-CN.md) | English

A Tauri plugin that provides secure storage functionality for Android applications using EncryptedSharedPreferences.

## Features

- Encrypted key-value secure storage
- Android-only support using EncryptedSharedPreferences
- Simple API: set, get, and delete operations
- Built-in encryption mechanism to protect sensitive data

## Platform Support

Android only

## Installation

Add the dependency to your `Cargo.toml`:

```toml
[dependencies]
tauri-plugin-secure-storage = { git = "https://github.com/kpmark/tauri-plugin-secure-storage" }
```

Or use a local path:

```toml
[dependencies]
tauri-plugin-secure-storage = { path = "./path/to/tauri-plugin-secure-storage" }
```

## Usage

### 1. Register the Plugin

In your Tauri application's `lib.rs` or `main.rs`:

```rust
    tauri::Builder::default()
        .plugin(tauri_plugin_secure_storage::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

```

### 2. Configure Permissions

Add the required permissions to your capabilities configuration file (e.g., `capabilities/default.json`):

```json
{
  "permissions": [
    "secure-storage:allow-delete",
    "secure-storage:allow-get",
    "secure-storage:allow-set",
    "secure-storage:default"
  ]
}
```

### 3. Frontend Usage (TypeScript/JavaScript)

```typescript
import { invoke } from "@tauri-apps/api/core";

// Define key names for type safety
export type SecureKeyName = "API_TOKEN" | "USER_PASSWORD" | "SECRET_KEY";

// Set a value
export async function secureSetKey(
  key: SecureKeyName,
  value: string
): Promise<void> {
  await invoke("plugin:secure-storage|set", { key, value });
}

// Get a value
export async function secureGetKey(key: SecureKeyName): Promise<string | null> {
  const res = await invoke<{ value: string | null }>(
    "plugin:secure-storage|get",
    { key }
  );
  return res?.value ?? null;
}

// Delete a value
export async function secureDeleteKey(key: SecureKeyName): Promise<void> {
  await invoke("plugin:secure-storage|delete", { key });
}
```

Example usage:

```typescript
// Store a token
await secureSetKey("API_TOKEN", "your-secret-token");

// Retrieve a token
const token = await secureGetKey("API_TOKEN");
console.log(token); // "your-secret-token" or null

// Delete a token
await secureDeleteKey("API_TOKEN");
```

### 4. Backend Usage (Rust)

You can also access the secure storage from Rust code:

```rust
use tauri_plugin_secure_storage::{GetRequest, SetRequest, DeleteRequest, SecureStorageExt};

// Get a value
pub fn load_api_token(app: &tauri::AppHandle) -> Result<String, String> {
    let resp = app
        .secure_storage()
        .get(GetRequest {
            key: "API_TOKEN".to_string(),
        })
        .map_err(|e| e.to_string())?;

    resp.value
        .filter(|v| !v.trim().is_empty())
        .ok_or_else(|| "API token not found".to_string())
}

// Set a value
pub fn save_api_token(app: &tauri::AppHandle, token: String) -> Result<(), String> {
    app.secure_storage()
        .set(SetRequest {
            key: "API_TOKEN".to_string(),
            value: token,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Delete a value
pub fn delete_api_token(app: &tauri::AppHandle) -> Result<(), String> {
    app.secure_storage()
        .delete(DeleteRequest {
            key: "API_TOKEN".to_string(),
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

## API Reference

### Frontend API

#### `invoke("plugin:secure-storage|set", { key, value })`

Stores a key-value pair in secure storage.

- **Parameters:**
  - `key`: `string` - The key to store the value under
  - `value`: `string` - The value to store
- **Returns:** `Promise<void>`

#### `invoke("plugin:secure-storage|get", { key })`

Retrieves a value from secure storage.

- **Parameters:**
  - `key`: `string` - The key to retrieve
- **Returns:** `Promise<{ value: string | null }>` - The stored value, or null if not found

#### `invoke("plugin:secure-storage|delete", { key })`

Deletes a value from secure storage.

- **Parameters:**
  - `key`: `string` - The key to delete
- **Returns:** `Promise<void>`

### Rust API

#### `SecureStorageExt::secure_storage()`

Access the secure storage instance.

#### `set(request: SetRequest) -> Result<SetResponse>`

Stores a key-value pair.

#### `get(request: GetRequest) -> Result<GetResponse>`

Retrieves a value by key.

#### `delete(request: DeleteRequest) -> Result<DeleteResponse>`

Deletes a value by key.

## Security

- Uses Android's **EncryptedSharedPreferences** for secure data storage
- All data is encrypted at rest
- Keys are generated and stored in the Android Keystore system
- Data is only accessible by your application

## Limitations

- **Android only** - This plugin currently only supports Android devices
- Not supported on desktop platforms (macOS, Windows, Linux) or iOS
- Requires Android API level 23 (Android 6.0) or higher

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
