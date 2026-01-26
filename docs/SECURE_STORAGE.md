# Tauri Plugin Secure Storage

一个为 Android 应用程序提供安全存储功能的 Tauri 插件，使用 EncryptedSharedPreferences 实现。

## 功能特性

- 加密的键值对安全存储
- 仅支持 Android 平台，使用 EncryptedSharedPreferences
- 简洁的 API：set、get 和 delete 操作
- 内置加密机制，保护敏感数据

## 平台支持

仅支持安卓平台

## 安装

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
tauri-plugin-secure-storage = { git = "https://github.com/kpmark/tauri-plugin-secure-storage" }
```

或使用本地路径：

```toml
[dependencies]
tauri-plugin-secure-storage = { path = "./path/to/tauri-plugin-secure-storage" }
```

## 使用方法

### 1. 注册插件

在 Tauri 应用的 `lib.rs` 或 `main.rs` 中：

```rust
    tauri::Builder::default()
        .plugin(tauri_plugin_secure_storage::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

```

### 2. 配置权限

在权限配置文件（例如 `capabilities/default.json`）中添加所需权限：

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

### 3. 前端使用 (TypeScript/JavaScript)

```typescript
import { invoke } from "@tauri-apps/api/core";

// 定义键名以获得类型安全
export type SecureKeyName = "API_TOKEN" | "USER_PASSWORD" | "SECRET_KEY";

// 设置值
export async function secureSetKey(
  key: SecureKeyName,
  value: string
): Promise<void> {
  await invoke("plugin:secure-storage|set", { key, value });
}

// 获取值
export async function secureGetKey(key: SecureKeyName): Promise<string | null> {
  const res = await invoke<{ value: string | null }>(
    "plugin:secure-storage|get",
    { key }
  );
  return res?.value ?? null;
}

// 删除值
export async function secureDeleteKey(key: SecureKeyName): Promise<void> {
  await invoke("plugin:secure-storage|delete", { key });
}
```

使用示例：

```typescript
// 存储令牌
await secureSetKey("API_TOKEN", "your-secret-token");

// 获取令牌
const token = await secureGetKey("API_TOKEN");
console.log(token); // "your-secret-token" 或 null

// 删除令牌
await secureDeleteKey("API_TOKEN");
```

### 4. 后端使用 (Rust)

你也可以在 Rust 代码中访问安全存储：

```rust
use tauri_plugin_secure_storage::{GetRequest, SetRequest, DeleteRequest, SecureStorageExt};

// 获取值
pub fn load_api_token(app: &tauri::AppHandle) -> Result<String, String> {
    let resp = app
        .secure_storage()
        .get(GetRequest {
            key: "API_TOKEN".to_string(),
        })
        .map_err(|e| e.to_string())?;

    resp.value
        .filter(|v| !v.trim().is_empty())
        .ok_or_else(|| "未找到 API 令牌".to_string())
}

// 设置值
pub fn save_api_token(app: &tauri::AppHandle, token: String) -> Result<(), String> {
    app.secure_storage()
        .set(SetRequest {
            key: "API_TOKEN".to_string(),
            value: token,
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}

// 删除值
pub fn delete_api_token(app: &tauri::AppHandle) -> Result<(), String> {
    app.secure_storage()
        .delete(DeleteRequest {
            key: "API_TOKEN".to_string(),
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

## API 参考

### 前端 API

#### `invoke("plugin:secure-storage|set", { key, value })`

在安全存储中存储键值对。

- **参数：**
  - `key`: `string` - 存储值的键名
  - `value`: `string` - 要存储的值
- **返回：** `Promise<void>`

#### `invoke("plugin:secure-storage|get", { key })`

从安全存储中获取值。

- **参数：**
  - `key`: `string` - 要获取的键名
- **返回：** `Promise<{ value: string | null }>` - 存储的值，如果未找到则为 null

#### `invoke("plugin:secure-storage|delete", { key })`

从安全存储中删除值。

- **参数：**
  - `key`: `string` - 要删除的键名
- **返回：** `Promise<void>`

### Rust API

#### `SecureStorageExt::secure_storage()`

访问安全存储实例。

#### `set(request: SetRequest) -> Result<SetResponse>`

存储键值对。

#### `get(request: GetRequest) -> Result<GetResponse>`

通过键名获取值。

#### `delete(request: DeleteRequest) -> Result<DeleteResponse>`

通过键名删除值。

## 安全性

- 使用 Android 的 **EncryptedSharedPreferences** 进行安全数据存储
- 所有数据在静态存储时都经过加密
- 密钥在 Android Keystore 系统中生成和存储
- 数据仅能被您的应用程序访问

## 限制

- **仅支持 Android** - 此插件目前仅支持 Android 设备
- 不支持桌面平台（macOS、Windows、Linux）或 iOS
- 需要 Android API level 23（Android 6.0）或更高版本
