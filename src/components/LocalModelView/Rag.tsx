import React from "react";
import { Button, Input } from "tdesign-mobile-react";
import { useInferenceStore } from "../../store/llmStore";

const Rag: React.FC = () => {
  const { retrievalStatus, retrievalInit, retrievalRelease } =
    useInferenceStore();

  const handleRetrievalChange = () => {
    if (retrievalStatus === "ready") {
      retrievalRelease();
    } else {
      retrievalInit();
    }
  };

  return (
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
            {retrievalStatus}
          </div>
        </div>
        {retrievalStatus === "ready" ? (
          <Button theme="primary" onClick={handleRetrievalChange} block>
            释放 RAG 引擎
          </Button>
        ) : retrievalStatus === "initializing" ? (
          <Button theme="default" block disabled>
            RAG 引擎初始化中...
          </Button>
        ) : retrievalStatus === "releasing" ? (
          <Button theme="default" block disabled>
            RAG 引擎释放中...
          </Button>
        ) : (
          <Button theme="primary" onClick={handleRetrievalChange} block>
            激活 RAG 引擎
          </Button>
        )}
      </div>

      <div className="card">
        <div className="card-title">知识库检索测试</div>
        <Input placeholder="输入搜索词..." style={{ marginBottom: "8px" }} />
        <Button theme="primary" variant="outline" block disabled>
          搜索测试 (Retrieve)
        </Button>

        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            background: "#f5f5f5",
            borderRadius: "8px",
            fontSize: "13px",
            whiteSpace: "pre-wrap",
            color: "#666",
          }}
        >
          （演示模式）这里会显示检索到的片段与数量。
        </div>
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
  );
};

export default Rag;
