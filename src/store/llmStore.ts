import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

type ResourceStatus = "idle" | "initializing" | "ready" | "releasing" | "error";

export interface InferenceConfig {
  llmConfigPath?: string;
  embeddingConfigPath?: string;
  ragDbPath?: string; // 这个在沙盒内部
}

interface InferenceStore {
  // 端侧模式开关
  onDeviceEnabled: boolean;

  // 资源状态
  llmStatus: ResourceStatus;
  retrievalStatus: ResourceStatus;

  // 最近错误信息
  lastError?: string;

  // 插件配置
  config: InferenceConfig;

  // 固定配置
  setConfig: (cfg: InferenceConfig) => void;

  // 资源空闲释放策略（ms）
  llmIdleReleaseMs: number;
  retrievalIdleReleaseMs: number;

  llmLastUsedAt?: number;
  retrievalLastUsedAt?: number;

  // 端侧模式切换
  enableOnDevice: () => Promise<void>;
  disableOnDevice: () => Promise<void>;

  // llm 动作
  llmInit: () => Promise<void>;
  llmRelease: () => Promise<void>;
  llmChat: (query: string) => Promise<string>;

  // rag动作
  retrievalInit: () => Promise<void>;
  retrievalRelease: () => Promise<void>;
  retrievalRetrieve: (query: string, topK?: number) => Promise<string>;

  // 空闲回收
  touchLlm: () => void;
  scheduleLlmIdleRelease: () => void;
  touchRetrieval: () => void;
  scheduleRetrievalIdleRelease: () => void;

  // 清楚错误日志
  clearError: () => void;
}

// 单飞锁：避免并发 init/release 抖动
let llmInitPromise: Promise<void> | null = null;
let llmReleasePromise: Promise<void> | null = null;

let retrievalInitPromise: Promise<void> | null = null;
let retrievalReleasePromise: Promise<void> | null = null;

let llmIdleTimer: ReturnType<typeof setTimeout> | null = null;
let retrievalIdleTimer: ReturnType<typeof setTimeout> | null = null;

function now() {
  return Date.now();
}

export const useInferenceStore = create<InferenceStore>((set, get) => ({
  onDeviceEnabled: false,

  llmStatus: "idle",
  retrievalStatus: "idle",

  lastError: undefined,

  config: {
    llmConfigPath: undefined,
    embeddingConfigPath: undefined,
    ragDbPath: undefined,
  },

  llmIdleReleaseMs: 3 * 60 * 1000, // 默认 3 分钟空闲回收
  retrievalIdleReleaseMs: 3 * 60 * 1000,
  llmLastUsedAt: undefined,
  retrievalLastUsedAt: undefined,

  setConfig: (cfg) => set({ config: cfg }),

  clearError: () => set({ lastError: undefined }),

  enableOnDevice: async () => {
    try {
      await get().llmInit();
      set({ onDeviceEnabled: true });
    } catch (e) {
      throw e;
    }
  },

  disableOnDevice: async () => {
    try {
      await get().llmRelease();
      set({ onDeviceEnabled: false });
    } catch (e) {
      throw e;
    }
  },

  llmInit: async () => {
    const { llmStatus, config } = get();
    const llmConfigPath = config.llmConfigPath;

    if (!llmConfigPath) {
      set({ lastError: "llmConfigPath 为空", llmStatus: "error" });
      throw new Error("llmConfigPath 为空");
    }

    if (llmStatus === "ready") return;
    if (llmInitPromise) return llmInitPromise;

    set({
      llmStatus: "initializing",
      lastError: undefined,
    });

    llmInitPromise = (async () => {
      try {
        await invoke("plugin:taskpilot-inference|llm_init", {
          payload: { configPath: llmConfigPath },
        });
        set({ llmStatus: "ready" });
        get().touchLlm();
      } catch (e: any) {
        set({ llmStatus: "error", lastError: String(e?.message ?? e) });
        throw e;
      } finally {
        llmInitPromise = null;
      }
    })();

    return llmInitPromise;
  },

  llmRelease: async () => {
    const { llmStatus } = get();
    if (llmStatus === "idle") return;
    if (llmReleasePromise) return llmReleasePromise;

    set({ llmStatus: "releasing" });

    llmReleasePromise = (async () => {
      try {
        await invoke("plugin:taskpilot-inference|llm_release");
        set({ llmStatus: "idle", llmLastUsedAt: undefined });
      } catch (e: any) {
        set({ llmStatus: "error", lastError: String(e?.message ?? e) });
        throw e;
      } finally {
        llmReleasePromise = null;
      }
    })();

    return llmReleasePromise;
  },

  llmChat: async (query) => {
    if (!query?.trim()) return "";

    if (get().onDeviceEnabled) {
      await get().llmInit();
    }
    if (get().llmStatus !== "ready") {
      throw new Error(get().lastError ?? "LLM 未就绪");
    }

    const res = await invoke<{ response: string }>(
      "plugin:taskpilot-inference|llm_chat",
      { payload: { query } }
    );
    get().touchLlm();
    return res?.response ?? "";
  },

  retrievalInit: async () => {
    const { retrievalStatus, config } = get();
    const embeddingConfigPath = config.embeddingConfigPath;
    const ragDbPath = config.ragDbPath;

    if (!embeddingConfigPath) {
      set({ lastError: "embeddingConfigPath 为空", retrievalStatus: "error" });
      throw new Error("embeddingConfigPath 为空");
    }
    if (!ragDbPath) {
      set({ lastError: "ragDbPath 为空", retrievalStatus: "error" });
      throw new Error("ragDbPath 为空");
    }

    if (retrievalStatus === "ready") return;
    if (retrievalInitPromise) return retrievalInitPromise;

    set({
      retrievalStatus: "initializing",
      lastError: undefined,
    });

    retrievalInitPromise = (async () => {
      try {
        // 先 embedding，再 rag（强绑定）
        await invoke("plugin:taskpilot-inference|embedding_init", {
          payload: { configPath: embeddingConfigPath },
        });
        await invoke("plugin:taskpilot-inference|rag_init", {
          payload: { dbPath: ragDbPath },
        });

        set({ retrievalStatus: "ready" });
        get().touchRetrieval();
      } catch (e: any) {
        set({ retrievalStatus: "error", lastError: String(e?.message ?? e) });
        // 如果 rag 初始化失败，尝试释放已经成功初始化的 embedding 避免资源泄露
        try {
          await invoke("plugin:taskpilot-inference|embedding_release").catch(
            () => undefined
          );
        } catch {}
        throw e;
      } finally {
        retrievalInitPromise = null;
      }
    })();

    return retrievalInitPromise;
  },

  retrievalRelease: async () => {
    const { retrievalStatus } = get();
    if (retrievalStatus === "idle") return;
    if (retrievalReleasePromise) return retrievalReleasePromise;

    set({ retrievalStatus: "releasing" });

    retrievalReleasePromise = (async () => {
      try {
        // 先释放 rag，再释放 embedding（强绑定）
        await invoke("plugin:taskpilot-inference|rag_release").catch(
          () => undefined
        );
        await invoke("plugin:taskpilot-inference|embedding_release").catch(
          () => undefined
        );

        set({ retrievalStatus: "idle", retrievalLastUsedAt: undefined });
      } catch (e: any) {
        set({ retrievalStatus: "error", lastError: String(e?.message ?? e) });
        throw e;
      } finally {
        retrievalReleasePromise = null;
      }
    })();

    return retrievalReleasePromise;
  },

  retrievalRetrieve: async (query, topK = 5) => {
    await get().retrievalInit();
    if (get().retrievalStatus !== "ready") {
      throw new Error(get().lastError ?? "检索引擎未就绪");
    }

    get().touchRetrieval();

    const res = await invoke<{ context: string; count: number }>(
      "plugin:taskpilot-inference|rag_retrieve",
      { payload: { query, topK } }
    );
    return res?.context ?? "";
  },

  touchLlm: () => {
    set({ llmLastUsedAt: now() });
    get().scheduleLlmIdleRelease();
  },

  scheduleLlmIdleRelease: () => {
    if (llmIdleTimer) clearTimeout(llmIdleTimer);

    llmIdleTimer = setTimeout(async () => {
      const s = get();
      const t = now();

      if (
        s.llmStatus === "ready" &&
        s.llmLastUsedAt &&
        t - s.llmLastUsedAt > s.llmIdleReleaseMs
      ) {
        await s.llmRelease().catch(() => undefined);
      }
    }, get().llmIdleReleaseMs);
  },

  touchRetrieval: () => {
    set({ retrievalLastUsedAt: now() });
    get().scheduleRetrievalIdleRelease();
  },

  scheduleRetrievalIdleRelease: () => {
    if (retrievalIdleTimer) clearTimeout(retrievalIdleTimer);

    retrievalIdleTimer = setTimeout(async () => {
      const s = get();
      const t = now();

      if (
        s.retrievalStatus === "ready" &&
        s.retrievalLastUsedAt &&
        t - s.retrievalLastUsedAt > s.retrievalIdleReleaseMs
      ) {
        await s.retrievalRelease().catch(() => undefined);
      }
    }, get().retrievalIdleReleaseMs);
  },
}));
