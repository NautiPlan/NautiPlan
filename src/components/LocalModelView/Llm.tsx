import React from "react";
import { Button, RadioGroup, Input } from "tdesign-mobile-react";
import { RocketOutlined, CheckCircleOutlined } from "@ant-design/icons";
import ModelDownload from "./ModelDownload";

const backends = [
  { label: "CPU", value: 0 },
  { label: "GPU (OpenCL)", value: 3 },
  { label: "NPU (Android)", value: 5 },
  { label: "Vulkan", value: 7 },
  { label: "自动", value: 4 },
];

const Llm: React.FC = () => {
  return (
    <div className="tab-container" style={{ padding: "16px 0" }}>
      <div className="card">
        <div className="card-title">
          <RocketOutlined /> LLM 后端配置
        </div>
        <RadioGroup value={0} onChange={() => undefined} options={backends} />
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
