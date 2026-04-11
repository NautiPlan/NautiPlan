import React from "react";
import { Button, RadioGroup, Input } from "tdesign-mobile-react";
import { RocketOutlined } from "@ant-design/icons";
import ModelDownload from "./ModelDownload";

const backends = [
  { label: "CPU", value: 0 },
  { label: "GPU (OpenCL)", value: 3 },
  { label: "NPU (Android)", value: 5 },
  { label: "Vulkan", value: 7 },
  { label: "自动", value: 4 },
];

const Embedding: React.FC = () => {
  return (
    <div className="tab-container" style={{ padding: "16px 0" }}>
      <div className="card">
        <div className="card-title">
          <RocketOutlined /> Vector 后端配置
        </div>
        <RadioGroup value={0} onChange={() => undefined} options={backends} />
      </div>

      <ModelDownload type="embedding" />

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
