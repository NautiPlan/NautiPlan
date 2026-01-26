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
import ModelDownload from "./ModelDownload";

const backends = [
  { label: "CPU", value: 0 },
  { label: "GPU (OpenCL)", value: 3 },
  { label: "NPU (Android)", value: 5 },
  { label: "Vulkan", value: 7 },
  { label: "自动", value: 4 },
];

const Llm: React.FC = () => {
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

      <ModelDownload type="llm" />

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
