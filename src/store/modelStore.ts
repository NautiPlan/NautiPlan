import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

type ModelStatus = "not-downloaded" | "downloading" | "downloaded";

export interface ModelInfo {
  id: string;
  name: string;
  size: string;
  type: "llm" | "embedding";
  status?: ModelStatus;
  progress?: number;
}

const availableModels: ModelInfo[] = [
  {
    id: "MNN/Qwen2.5-1.5B-Instruct-MNN",
    name: "Qwen2.5-1.5B-Instruct-MNN",
    size: "879MB",
    type: "llm",
    status: "not-downloaded",
  },
  {
    id: "MNN/bge-large-zh-MNN",
    name: "bge-large-zh-MNN",
    size: "217MB",
    type: "embedding",
    status: "not-downloaded",
  },
];

type DownloadProgressPayload = {
  model_id: string;
  file_path: string;
  current: number;
  total: number;
};

let unlistenDownloadProgress: UnlistenFn | null = null;

interface ModelStore {
  models: ModelInfo[];
  downloadStatus: Record<string, ModelStatus>;
  updateModels: () => Promise<void>;
  downloadModel: (id: string) => Promise<void>;
  initDownloadProgressListener: () => Promise<void>;
  uninstallModel: (id: string) => Promise<void>;
}

export const useModelStore = create<ModelStore>((set, get) => ({
  models: availableModels,
  loading: false,
  downloadStatus: {},

  async initDownloadProgressListener() {
    if (unlistenDownloadProgress) return;

    unlistenDownloadProgress = await listen<DownloadProgressPayload>(
      "taskpilot://download-progress",
      (event) => {
        const p = event.payload;
        if (!p?.model_id) return;

        const percent =
          p.total > 0
            ? Math.max(
                0,
                Math.min(100, Math.floor((p.current / p.total) * 100))
              )
            : 0;

        set((state) => ({
          downloadStatus: {
            ...state.downloadStatus,
            [p.model_id]: "downloading",
          },
          models: state.models.map((m) =>
            m.id === p.model_id
              ? {
                  ...m,
                  status: "downloading",
                  progress: percent,
                }
              : m
          ),
        }));
      }
    );
  },

  async updateModels() {
    try {
      const list: { model_id: string; completed: boolean }[] =
        await invoke("list_models");

      const models = get().models.map((model) => {
        const remote = list.find((m) => m.model_id === model.name);

        let status: ModelStatus = "not-downloaded";

        if (remote) {
          status = remote.completed ? "downloaded" : "not-downloaded";
        }

        return {
          ...model,
          status,
        };
      });

      set({ models });
    } catch (error) {
      console.error("Failed to list models:", error);
    }
  },

  async downloadModel(id: string) {
    set((state) => ({
      models: state.models.map((model) =>
        model.id === id
          ? { ...model, status: "downloading" as ModelStatus }
          : model
      ),
    }));
    try {
      await invoke("download", { id });
      set((state) => ({
        models: state.models.map((model) =>
          model.id === id
            ? { ...model, status: "downloaded" as ModelStatus }
            : model
        ),
      }));
    } catch (error) {
      set((state) => ({
        models: state.models.map((model) =>
          model.id === id
            ? { ...model, status: "not-downloaded" as ModelStatus }
            : model
        ),
      }));
      console.error("下载失败：", error);
    }
  },

  async uninstallModel(id: string) {
    const prevStatus = get().models.find((m) => m.id === id)?.status;
    try {
      await invoke("uninstall", { id });
      set((state) => ({
        models: state.models.map((model) =>
          model.id === id
            ? { ...model, status: "not-downloaded" as ModelStatus }
            : model
        ),
      }));
    } catch (error) {
      set((state) => ({
        models: state.models.map((model) =>
          model.id === id
            ? { ...model, status: prevStatus ?? "not-downloaded" }
            : model
        ),
      }));
      console.error("卸载失败：", error);
    }
  },
}));
