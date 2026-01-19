import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import {
  Button,
  RadioGroup,
  Input,
  Progress,
  Toast,
  Tabs,
  TabPanel,
} from "tdesign-mobile-react";
import {
  CloudDownloadOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { useInferenceStore } from "../store/llmStore";
import "../styles/pages/LocalModelView.css";

type ResourceStatus = "idle" | "initializing" | "ready" | "releasing" | "error";

interface ModelInfo {
  id: string;
  name: string;
  size: string;
  status: "not-downloaded" | "downloading" | "downloaded";
  progress?: number;
  configRelPathPath: string; // 相对路径，如 models/llm/qwen/config.json
}

const LocalModelView: React.FC = () => {
  // 1. 本地状态管理
  const [activeTab, setActiveTab] = useState<string>("llm");
  const [appDir, setAppDir] = useState<string>("");

  const {
    llmStatus,
    retrievalStatus,
    setConfig,
    lastError: storeError,
  } = useInferenceStore();

  const [localLlmStatus, setLocalLlmStatus] = useState<ResourceStatus>("idle");
  const [localRetrievalStatus, setLocalRetrievalStatus] =
    useState<ResourceStatus>("idle");

  const [llmBackend, setLlmBackend] = useState(0); // LLM 后端
  const [embedBackend, setEmbedBackend] = useState(0); // Embedding 后端

  const [selectedLlmId, setSelectedLlmId] = useState<string>(
    () => localStorage.getItem("taskpilot_selected_llm") || "qwen2.5-1.5b"
  );
  const [selectedEmbedId, setSelectedEmbedId] = useState<string>(
    () => localStorage.getItem("taskpilot_selected_embed") || "bge-large-zh"
  );

  const [lastError, setLastError] = useState<string | null>(null);

  // 初始化路径
  useEffect(() => {
    appDataDir().then(setAppDir).catch(console.error);
  }, []);

  // 持久化选中项
  useEffect(() => {
    localStorage.setItem("taskpilot_selected_llm", selectedLlmId);
  }, [selectedLlmId]);

  useEffect(() => {
    localStorage.setItem("taskpilot_selected_embed", selectedEmbedId);
  }, [selectedEmbedId]);

  const backends = [
    { label: "CPU", value: 0 },
    { label: "GPU (OpenCL)", value: 3 },
    { label: "NPU (Android)", value: 5 },
    { label: "Vulkan", value: 7 },
    { label: "自动", value: 4 },
  ];

  const [llmModels, setLlmModels] = useState<ModelInfo[]>(() => {
    const saved = localStorage.getItem("taskpilot_llm_models");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "qwen2.5-1.5b",
            name: "Qwen2.5-1.5B-Instruct",
            size: "1.2GB",
            status: "downloaded",
            configRelPathPath: "models/llm/qwen2.5-1.5b/config.json",
          },
          {
            id: "qwen2.5-7b",
            name: "Qwen2.5-7B-Instruct (GGUF)",
            size: "5.5GB",
            status: "not-downloaded",
            configRelPathPath: "models/llm/qwen2.5-7b/config.json",
          },
        ];
  });

  const [embedModels, setEmbedModels] = useState<ModelInfo[]>(() => {
    const saved = localStorage.getItem("taskpilot_embed_models");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "bge-large-zh",
            name: "BGE-Large-ZH",
            size: "1.3GB",
            status: "not-downloaded",
            configRelPathPath: "models/embedding/bge-large-zh/config.json",
          },
          {
            id: "bge-small-zh",
            name: "BGE-Small-ZH",
            size: "120MB",
            status: "downloaded",
            configRelPathPath: "models/embedding/bge-small-zh/config.json",
          },
        ];
  });

  // 持久化模型列表
  useEffect(() => {
    localStorage.setItem("taskpilot_llm_models", JSON.stringify(llmModels));
  }, [llmModels]);

  useEffect(() => {
    localStorage.setItem("taskpilot_embed_models", JSON.stringify(embedModels));
  }, [embedModels]);

  // 推理测试相关
  const [testQuery, setTestQuery] = useState("你好，请做下自我介绍");
  const [testOutput, setTestOutput] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  // Embedding 测试相关
  const [embedTestInput, setEmbedTestInput] =
    useState("测试一段文本的向量编码");
  const [embedTestOutput, setEmbedTestOutput] = useState("");

  // RAG 测试相关
  const [ragTestInput, setRagTestInput] = useState("基于已知文档回答问题");
  const [ragTestOutput, setRagTestOutput] = useState("");

  // 3. 分类下载逻辑 (优化后：模拟更真实的过程)
  const handleDownload = async (modelId: string, type: "llm" | "embedding") => {
    const updateProgress = (prev: ModelInfo[]): ModelInfo[] =>
      prev.map((m) =>
        m.id === modelId ? { ...m, status: "downloading", progress: 0 } : m
      );

    if (type === "llm") setLlmModels(updateProgress);
    else setEmbedModels(updateProgress);

    // 模拟真实下载的随机进度
    let progress = 0;
    while (progress < 100) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 100) progress = 100;

      const setter = type === "llm" ? setLlmModels : setEmbedModels;
      setter((prev: ModelInfo[]) =>
        prev.map((m) => (m.id === modelId ? { ...m, progress: progress } : m))
      );
    }

    const setFinal = (prev: ModelInfo[]): ModelInfo[] =>
      prev.map((m) =>
        m.id === modelId ? { ...m, status: "downloaded", progress: 100 } : m
      );

    if (type === "llm") setLlmModels(setFinal);
    else setEmbedModels(setFinal);

    Toast.success(`${type.toUpperCase()} 模型下载完成`);
  };

  // 4. 定向加载逻辑
  const handleLoadLlm = async () => {
    const model = llmModels.find((m) => m.id === selectedLlmId);
    if (!model || model.status !== "downloaded") {
      Toast.error("请先下载选中的 LLM 模型");
      return;
    }

    setLocalLlmStatus("initializing");
    setLastError(null);
    try {
      if (!appDir) throw new Error("应用数据目录尚未准备就绪，请稍候");

      const configPath = await join(appDir, model.configRelPathPath);

      // 同步到全局 Store 配置
      setConfig({
        llmConfigPath: configPath,
      });

      // 调用插件初始化
      await invoke("plugin:taskpilot-inference|llm_init", {
        payload: { configPath },
      });

      setLocalLlmStatus("ready");
      Toast.success("LLM 加载成功");
    } catch (e: any) {
      setLocalLlmStatus("error");
      setLastError(String(e));
      Toast.error("LLM 加载失败");
    }
  };

  const handleLoadRag = async () => {
    const model = embedModels.find((m) => m.id === selectedEmbedId);
    if (!model || model.status !== "downloaded") {
      Toast.error("请先下载选中的 Embedding 模型");
      return;
    }

    setLocalRetrievalStatus("initializing");
    setLastError(null);
    try {
      if (!appDir) throw new Error("应用数据目录尚未准备就绪，请稍候");

      const embedConfigPath = await join(appDir, model.configRelPathPath);
      const dbPath = await join(appDir, "databases", "rag.db");

      // 同步到全局 Store 配置
      setConfig({
        embeddingConfigPath: embedConfigPath,
        ragDbPath: dbPath,
      });

      await invoke("plugin:taskpilot-inference|embedding_init", {
        payload: { configPath: embedConfigPath },
      });
      await invoke("plugin:taskpilot-inference|rag_init", {
        payload: { dbPath },
      });

      setLocalRetrievalStatus("ready");
      Toast.success("RAG 引擎就绪");
    } catch (e: any) {
      setLocalRetrievalStatus("error");
      setLastError(String(e));
      Toast.error("RAG 加载失败");
    }
  };

  const handleTestChat = async () => {
    if (!testQuery.trim()) return;
    setIsTesting(true);
    setTestOutput("正在生成...");
    try {
      const res = await invoke<{ response: string }>(
        "plugin:taskpilot-inference|llm_chat",
        { payload: { query: testQuery } }
      );
      setTestOutput(res.response);
    } catch (e: any) {
      setTestOutput("错误: " + (e?.message || e));
      Toast.error("对话测试失败");
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestEmbed = async () => {
    if (!embedTestInput.trim()) return;
    setIsTesting(true);
    setEmbedTestOutput("编码中...");
    try {
      const res = await invoke<{ vector: number[]; dimension: number }>(
        "plugin:taskpilot-inference|embedding_encode",
        { payload: { text: embedTestInput } }
      );
      setEmbedTestOutput(
        `维度: ${res.dimension}\n前 5 位: [${res.vector
          .slice(0, 5)
          .join(", ")}...]`
      );
    } catch (e: any) {
      setEmbedTestOutput("错误: " + (e?.message || e));
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestRag = async () => {
    if (!ragTestInput.trim()) return;
    setIsTesting(true);
    setRagTestOutput("检索中...");
    try {
      const res = await invoke<{ context: string; count: number }>(
        "plugin:taskpilot-inference|rag_retrieve",
        {
          payload: { query: ragTestInput, topK: 3 },
        }
      );
      setRagTestOutput(`找到 ${res.count} 个片段:\n${res.context}`);
    } catch (e: any) {
      setRagTestOutput("错误: " + (e?.message || e));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="local-model-view">
      <Tabs
        value={activeTab}
        onChange={(v: any) => setActiveTab(String(v))}
        sticky
      >
        <TabPanel label="LLM 推理" value="llm">
          <div className="tab-container" style={{ padding: "16px 0" }}>
            <div className="card">
              <div className="card-title">
                <RocketOutlined /> LLM 后端配置
              </div>
              <RadioGroup
                value={llmBackend}
                onChange={(v: any) => setLlmBackend(Number(v))}
                options={backends}
              />
            </div>

            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div className="card-title" style={{ margin: 0 }}>
                  运行状态
                </div>
                <div className={`status-value status-${llmStatus}`}>
                  {llmStatus.toUpperCase()}
                </div>
              </div>
              <Button
                theme="primary"
                block
                onClick={handleLoadLlm}
                loading={localLlmStatus === "initializing"}
                disabled={llmStatus === "ready"}
              >
                {llmStatus === "ready" ? "LLM 已激活" : "激活 LLM 模型"}
              </Button>
            </div>

            <div className="card">
              <div className="card-title">
                <CloudDownloadOutlined /> LLM 模型仓库
              </div>
              <div className="model-list">
                {llmModels.map((model) => (
                  <div
                    key={model.id}
                    className={`model-item ${
                      selectedLlmId === model.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedLlmId(model.id)}
                    style={{
                      padding: "12px",
                      border:
                        selectedLlmId === model.id
                          ? "1.5px solid #0052d9"
                          : "1px solid #eee",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      background:
                        selectedLlmId === model.id ? "#f0f7ff" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          className="model-name"
                          style={{ fontWeight: "bold" }}
                        >
                          {model.name}
                        </div>
                        <div
                          className="model-meta"
                          style={{ fontSize: "12px", color: "#666" }}
                        >
                          {model.size} | {model.status}
                        </div>
                      </div>
                      {model.status !== "downloaded" && (
                        <Button
                          size="small"
                          theme="primary"
                          disabled={model.status === "downloading"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(model.id, "llm");
                          }}
                        >
                          下载
                        </Button>
                      )}
                    </div>
                    {model.status === "downloading" && (
                      <Progress
                        percentage={model.progress || 0}
                        style={{ marginTop: "8px" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <CheckCircleOutlined /> 推理独立测试
              </div>
              <Input
                placeholder="输入对话 Prompt"
                value={testQuery}
                onChange={(val) => setTestQuery(String(val))}
                style={{ marginBottom: "8px" }}
              />
              <Button
                theme="primary"
                variant="outline"
                block
                onClick={handleTestChat}
                loading={isTesting}
                disabled={llmStatus !== "ready"}
              >
                对话测试
              </Button>
              {testOutput && (
                <div
                  className="test-output"
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    fontSize: "14px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {testOutput}
                </div>
              )}
            </div>
          </div>
        </TabPanel>

        <TabPanel label="Embedding" value="embedding">
          <div className="tab-container" style={{ padding: "16px 0" }}>
            <div className="card">
              <div className="card-title">
                <RocketOutlined /> Vector 后端配置
              </div>
              <RadioGroup
                value={embedBackend}
                onChange={(v: any) => setEmbedBackend(Number(v))}
                options={backends}
              />
            </div>

            <div className="card">
              <div className="card-title">
                <DatabaseOutlined /> Embedding 模型仓库
              </div>
              <div className="model-list">
                {embedModels.map((model) => (
                  <div
                    key={model.id}
                    className={`model-item ${
                      selectedEmbedId === model.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedEmbedId(model.id)}
                    style={{
                      padding: "12px",
                      border:
                        selectedEmbedId === model.id
                          ? "1.5px solid #0052d9"
                          : "1px solid #eee",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      background:
                        selectedEmbedId === model.id ? "#f0f7ff" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          className="model-name"
                          style={{ fontWeight: "bold" }}
                        >
                          {model.name}
                        </div>
                        <div
                          className="model-meta"
                          style={{ fontSize: "12px", color: "#666" }}
                        >
                          {model.size} | {model.status}
                        </div>
                      </div>
                      {model.status !== "downloaded" && (
                        <Button
                          size="small"
                          theme="primary"
                          disabled={model.status === "downloading"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(model.id, "embedding");
                          }}
                        >
                          下载
                        </Button>
                      )}
                    </div>
                    {model.status === "downloading" && (
                      <Progress
                        percentage={model.progress || 0}
                        style={{ marginTop: "8px" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title">向量编码测试</div>
              <Input
                placeholder="输入文本..."
                value={embedTestInput}
                onChange={(val) => setEmbedTestInput(String(val))}
                style={{ marginBottom: "8px" }}
              />
              <Button
                theme="primary"
                variant="outline"
                block
                onClick={handleTestEmbed}
                loading={isTesting}
                disabled={retrievalStatus === "idle"}
              >
                编码测试 (Embed)
              </Button>
              {embedTestOutput && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                >
                  {embedTestOutput}
                </div>
              )}
            </div>
          </div>
        </TabPanel>

        <TabPanel label="RAG 检索" value="rag">
          <div className="tab-container" style={{ padding: "16px 0" }}>
            <div className="card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div className="card-title" style={{ margin: 0 }}>
                  RAG 引擎状态
                </div>
                <div className={`status-value status-${retrievalStatus}`}>
                  {retrievalStatus.toUpperCase()}
                </div>
              </div>
              <Button
                theme="primary"
                block
                onClick={handleLoadRag}
                loading={localRetrievalStatus === "initializing"}
                disabled={retrievalStatus === "ready"}
              >
                {retrievalStatus === "ready" ? "RAG 已就绪" : "激活 RAG 引擎"}
              </Button>
            </div>

            <div className="card">
              <div className="card-title">知识库检索测试</div>
              <Input
                placeholder="输入搜索词..."
                value={ragTestInput}
                onChange={(val) => setRagTestInput(String(val))}
                style={{ marginBottom: "8px" }}
              />
              <Button
                theme="primary"
                variant="outline"
                block
                onClick={handleTestRag}
                loading={isTesting}
                disabled={retrievalStatus !== "ready"}
              >
                搜索测试 (Retrieve)
              </Button>
              {ragTestOutput && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: "#f5f5f5",
                    borderRadius: "8px",
                    fontSize: "13px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {ragTestOutput}
                </div>
              )}
            </div>

            <div
              className="card managed-info"
              style={{ background: "#f0f7ff", border: "none" }}
            >
              <div className="card-title" style={{ fontSize: "14px" }}>
                RAG 管理说明
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                RAG 引擎依赖选中的 Embedding 模型及软件管理的 SQLite 数据库。
              </div>
            </div>
          </div>
        </TabPanel>
      </Tabs>

      {lastError && (
        <div
          className="card"
          style={{
            margin: "0 16px 16px",
            border: "1px solid #ff4d4f",
            background: "#fff2f0",
          }}
        >
          <div style={{ color: "#ff4d4f", fontSize: "12px" }}>
            <strong>错误日志:</strong>
            <div style={{ wordBreak: "break-all" }}>{lastError}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalModelView;
