import { useEffect, useState } from "react";
import type { SecureKeyName } from "../utils/apiKey";
import { secureDeleteKey, secureGetKey, secureSetKey } from "../utils/apiKey";
import { Picker } from "antd-mobile";

type Props = {
  defaultKeyName?: SecureKeyName;
  onChanged?: (keyName: SecureKeyName) => void;
  className?: string;
};

function maskKey(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 3)}${"*".repeat(
    Math.min(12, value.length - 6)
  )}${value.slice(-3)}`;
}

export default function ApiKeyButton(props: Props) {
  const { defaultKeyName = "ALIAPI_KEY", onChanged, className } = props;

  const [open, setOpen] = useState(false);
  const [keyName, setKeyName] = useState<SecureKeyName>(defaultKeyName);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [currentValue, setCurrentValue] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [showPlain, setShowPlain] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      const v = await secureGetKey(keyName);
      setCurrentValue(v);
    } catch (e: any) {
      setCurrentValue(null);
      setMessage(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, keyName]);

  async function onSave() {
    setLoading(true);
    setMessage(null);
    try {
      await secureSetKey(keyName, inputValue);
      setInputValue("");
      await refresh();
      setMessage("已保存。");
      onChanged?.(keyName);
    } catch (e: any) {
      setMessage(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    setLoading(true);
    setMessage(null);
    try {
      await secureDeleteKey(keyName);
      await refresh();
      setMessage("已删除。");
      onChanged?.(keyName);
    } catch (e: any) {
      setMessage(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        aria-label="API Key 设置"
        title="API Key 设置"
        style={{
          border: "none",
          background: "transparent",
          padding: 8,
          cursor: "pointer",
          lineHeight: 0,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.4 7.4 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 900, // Reduced zIndex to allow ant-design components (usually zIndex 1000+) to appear on top
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600 }}>API Key 设置</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                关闭
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#555" }}>选择 Key</span>
                <div
                  onClick={() => setPickerVisible(true)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    boxSizing: "border-box", // Ensure padding doesn't affect width
                  }}
                >
                  {keyName}
                </div>
                <Picker
                  columns={[
                    [
                      { label: "ALIAPI_KEY", value: "ALIAPI_KEY" },
                      { label: "WEBAPI_KEY", value: "WEBAPI_KEY" },
                    ],
                  ]}
                  visible={pickerVisible}
                  onClose={() => setPickerVisible(false)}
                  value={[keyName]}
                  onConfirm={(v) => {
                    setKeyName(v[0] as SecureKeyName);
                  }}
                />
              </label>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, color: "#555" }}>当前值</div>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #eee",
                    background: "#fafafa",
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: 13,
                    color: "#222",
                    wordBreak: "break-all",
                  }}
                >
                  {loading
                    ? "读取中..."
                    : currentValue
                    ? maskKey(currentValue)
                    : "未设置"}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  提示：输入后点击“保存”写入安全存储；点击“删除”会清除该 Key。
                </div>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#555" }}>输入新值</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type={showPlain ? "text" : "password"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="粘贴/输入你的 Key"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlain((v) => !v)}
                    style={{
                      border: "1px solid #ddd",
                      background: "#fff",
                      borderRadius: 10,
                      padding: "10px 12px",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {showPlain ? "隐藏" : "显示"}
                  </button>
                </div>
              </label>

              {message && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    color: "#7c2d12",
                    fontSize: 13,
                  }}
                >
                  {message}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={loading}
                  style={{
                    border: "1px solid #ef4444",
                    background: "#fff",
                    color: "#ef4444",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  删除 Key
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={loading || !inputValue.trim()}
                  style={{
                    border: "1px solid #111827",
                    background: "#111827",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    opacity: loading || !inputValue.trim() ? 0.6 : 1,
                  }}
                >
                  保存 Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
