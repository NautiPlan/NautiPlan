import React from "react";
import { Button, RadioGroup, Input, Progress } from "tdesign-mobile-react";
import {
  CloudDownloadOutlined,
  RocketOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useInferenceStore } from "../../store/llmStore";
import { useModelStore } from "../../store/modelStore";
import { useState } from "react";

const backends = [
  { label: "CPU", value: 0 },
  { label: "GPU (OpenCL)", value: 3 },
  { label: "NPU (Android)", value: 5 },
  { label: "Vulkan", value: 7 },
  { label: "自动", value: 4 },
];

const Llm: React.FC = () => {
  const { models, downloadModel } = useModelStore();
  const [selectedId, setSelectedId] = useState<string | null>(
    "MNN/Qwen2.5-1.5B-Instruct-MNN"
  );
  const { llmStatus } = useInferenceStore();

  return (
    <div className="tab-container" style={{ padding: "16px 0" }}>
      <>此页面仅作演示，具体功能实现需结合OPPO能力支持</>
      <div className="card">
        <div className="card-title">
          <RocketOutlined /> LLM 后端配置
        </div>
        <RadioGroup value={0} onChange={() => undefined} options={backends} />
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
          <div className={`status-value status-${llmStatus}`}>{llmStatus}</div>
        </div>
        <Button theme="primary" block disabled>
          激活 LLM 模型
        </Button>
      </div>

      <div className="card">
        <div className="card-title">
          <CloudDownloadOutlined /> LLM 模型仓库
        </div>
        <div className="model-list">
          {models
            .filter((model) => model.type === "llm")
            .map((model) => {
              const isSelected = selectedId === model.id;
              const isDownloading = model.status === "downloading";
              const isDownloaded = model.status === "downloaded";
              return (
                <div
                  key={model.id}
                  className={`model-item ${isSelected ? "selected" : ""}`}
                  style={{
                    padding: "12px",
                    border: isSelected
                      ? "1.5px solid #0052d9"
                      : "1px solid #eee",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    background: isSelected ? "#f0f7ff" : "white",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedId(model.id)}
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
                        {model.size} | {model.status ?? "not-downloaded"}
                      </div>
                    </div>

                    {!isDownloaded ? (
                      <Button
                        size="small"
                        theme="primary"
                        disabled={isDownloading}
                        onClick={(e) => {
                          e.stopPropagation(); // 避免点按钮触发选中卡片
                          void downloadModel(model.id);
                        }}
                      >
                        {isDownloading ? "下载中" : "下载"}
                      </Button>
                    ) : (
                      <div style={{ color: "#2ba471", fontSize: "12px" }}>
                        已下载
                      </div>
                    )}
                  </div>

                  {model.status === "downloading" && (
                    <Progress
                      percentage={model.progress ?? 0}
                      style={{ marginTop: "8px" }}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <CheckCircleOutlined /> 推理独立测试
        </div>
        <Input placeholder="输入测试 Prompt" style={{ marginBottom: "8px" }} />
        <Button theme="primary" variant="outline" block disabled>
          对话测试
        </Button>
      </div>
    </div>
  );
};

export default Llm;
