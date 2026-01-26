import React from "react";
import { Button, Progress } from "tdesign-mobile-react";
import { useModelStore } from "../../store/modelStore";

interface ModelDownloadProps {
  type: "llm" | "embedding";
}

const ModelDownload: React.FC<ModelDownloadProps> = ({ type }) => {
  const { models, downloadModel } = useModelStore();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  return (
    <div className="card">
      <div className="card-title">
        {type === "llm" ? "LLM 模型仓库" : "Embedding 模型仓库"}
      </div>
      <div className="model-list">
        {models
          .filter((model) => model.type === type) // 根据传入的类型过滤模型
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
                  border: isSelected ? "1.5px solid #0052d9" : "1px solid #eee",
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
                    <div className="model-name" style={{ fontWeight: "bold" }}>
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
  );
};

export default ModelDownload;
