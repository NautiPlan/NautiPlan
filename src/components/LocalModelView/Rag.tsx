import React from "react";
import { Button, Input } from "tdesign-mobile-react";
import { useInferenceStore } from "../../store/llmStore";
import { useState } from "react";

const Rag: React.FC = () => {
  const {
    retrievalStatus,
    retrievalInit,
    retrievalRelease,
    retrievalAdd,
    retrievalRemove,
    retrievalRetrieve,
  } = useInferenceStore();

  // 知识输入
  const [inputValue, setInputValue] = useState("");
  const onInputValueChange = (value: any) => {
    const stringValue = String(value);
    setInputValue(stringValue);
  };

  // 检索输入
  const [queryValue, setQueryValue] = useState("");
  const onQueryValueChange = (value: any) => {
    const stringValue = String(value);
    setQueryValue(stringValue);
  };

  // 检索结果
  const [retrieveResult, setRetrieveResult] = useState("");

  const handleRetrievalChange = () => {
    if (retrievalStatus === "ready") {
      retrievalRelease();
    } else {
      retrievalInit();
    }
  };

  const handleRetrievalAdd = async () => {
    if (!inputValue.trim()) return;
    if (retrievalStatus !== "ready") return;

    try {
      await retrievalAdd(inputValue.trim());
      setInputValue("");
    } catch (error) {
      console.error("Failed to add document to RAG:", error);
    }
  };

  const handleInputClear = () => {
    setInputValue("");
  };

  const handleKnowledgeBaseClear = async () => {
    if (retrievalStatus !== "ready") return;

    try {
      await retrievalRemove();
    } catch (error) {
      console.error("Failed to clear knowledge base:", error);
    }
  };

  const handleRetrieveTest = async () => {
    if (retrievalStatus !== "ready") return;
    const query = queryValue.trim();
    try {
      const context = await retrievalRetrieve(query, 5);
      setQueryValue("");
      setRetrieveResult(context);
    } catch (error) {
      console.error("Failed to retrieve from RAG:", error);
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
        <div className="card-title">向 RAG 导入资料</div>
        <Input
          placeholder="在此粘贴文本或描述要导入的资料"
          style={{ marginBottom: 8 }}
          value={inputValue}
          onChange={onInputValueChange}
          disabled={retrievalStatus !== "ready"}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            theme="primary"
            onClick={handleRetrievalAdd}
            block
            disabled={retrievalStatus !== "ready"}
          >
            添加资料
          </Button>
          <Button
            theme="default"
            onClick={handleInputClear}
            block
            disabled={retrievalStatus !== "ready"}
          >
            清除内容
          </Button>
        </div>
        <div style={{ marginTop: 8 }}>
          <Button
            theme="danger"
            onClick={handleKnowledgeBaseClear}
            block
            disabled={retrievalStatus !== "ready"}
          >
            清空知识库
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">知识库检索测试</div>
        <Input
          placeholder="输入搜索词..."
          value={queryValue}
          onChange={onQueryValueChange}
          style={{ marginBottom: "8px" }}
        />
        <Button
          theme="primary"
          variant="outline"
          onClick={handleRetrieveTest}
          block
          disabled={retrievalStatus !== "ready"}
        >
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
          <div>
            {retrieveResult}
            <div>（演示模式）这里会显示检索到的片段。</div>
          </div>
          <Button theme="default" onClick={() => setRetrieveResult("")} block>
            清空日志
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Rag;
