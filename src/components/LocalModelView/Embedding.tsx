import React from "react";
import { Button, RadioGroup, Input, Progress } from "tdesign-mobile-react";
import { DatabaseOutlined, RocketOutlined } from "@ant-design/icons";

const backends = [
  { label: "CPU", value: 0 },
  { label: "GPU (OpenCL)", value: 3 },
  { label: "NPU (Android)", value: 5 },
  { label: "Vulkan", value: 7 },
  { label: "自动", value: 4 },
];

type ModelStatus = "not-downloaded" | "downloading" | "downloaded";

type DemoEmbeddingModel = {
  id: string;
  name: string;
  dim: string;
  size: string;
  status: ModelStatus;
  progress?: number;
};

const demoModels: DemoEmbeddingModel[] = [
  {
    id: "bge-large-zh",
    name: "BGE-Large-ZH",
    dim: "1024",
    size: "1.3GB",
    status: "not-downloaded" as const,
  },
  {
    id: "bge-small-zh",
    name: "BGE-Small-ZH",
    dim: "384",
    size: "120MB",
    status: "downloaded",
  },
];

const Embedding: React.FC = () => {
  const selectedId = demoModels[0].id;

  return (
    <div className="tab-container" style={{ padding: "16px 0" }}>
      <>此页面仅作演示，具体功能实现需结合OPPO能力支持</>
      <div className="card">
        <div className="card-title">
          <RocketOutlined /> Vector 后端配置
        </div>
        <RadioGroup value={0} onChange={() => undefined} options={backends} />
      </div>

      <div className="card">
        <div className="card-title">
          <DatabaseOutlined /> Embedding 模型仓库
        </div>
        <div className="model-list">
          {demoModels.map((model) => (
            <div
              key={model.id}
              className={`model-item ${selectedId === model.id ? "selected" : ""}`}
              style={{
                padding: "12px",
                border:
                  selectedId === model.id
                    ? "1.5px solid #0052d9"
                    : "1px solid #eee",
                borderRadius: "8px",
                marginBottom: "8px",
                background: selectedId === model.id ? "#f0f7ff" : "white",
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
                  <div className="model-name" style={{ fontWeight: "bold" }}>
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
                  <Button size="small" theme="primary" disabled>
                    下载
                  </Button>
                )}
              </div>

              {model.status === "downloading" && (
                <Progress
                  percentage={model.progress ?? 0}
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">向量编码测试</div>
        <Input placeholder="输入文本..." style={{ marginBottom: "8px" }} />
        <Button theme="primary" variant="outline" block disabled>
          编码测试 (Embed)
        </Button>
      </div>
    </div>
  );
};

export default Embedding;
