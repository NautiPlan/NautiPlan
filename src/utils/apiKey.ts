import { invoke } from "@tauri-apps/api/core";

export type SecureKeyName = "WEBAPI_KEY" | "ALIAPI_KEY";

export async function secureSetKey(
  key: SecureKeyName,
  value: string
): Promise<void> {
  await invoke("plugin:secure-storage|set", { key, value });
}

export async function secureGetKey(key: SecureKeyName): Promise<string | null> {
  const res = await invoke<{ value: string | null }>(
    "plugin:secure-storage|get",
    { key }
  );
  return res?.value ?? null;
}

export async function secureDeleteKey(key: SecureKeyName): Promise<void> {
  await invoke("plugin:secure-storage|delete", { key });
}
