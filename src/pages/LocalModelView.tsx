import { Tabs } from "antd-mobile";

import Llm from "../components/LocalModelView/Llm";
import Embedding from "../components/LocalModelView/Embedding";
import Rag from "../components/LocalModelView/Rag";
import ApiKeyButton from "../components/ApiKey";
import "../styles/pages/LocalModelView.css";

const LocalModelView: React.FC = () => {
  return (
    <div className="local-model-view">
      <div className="api-key-section">
        <ApiKeyButton defaultKeyName="ALIAPI_KEY" />
      </div>
      <Tabs>
        <Tabs.Tab title="LLM(演示)" key="llm">
          <Llm />
        </Tabs.Tab>
        <Tabs.Tab title="Embedding(演示)" key="embedding">
          <Embedding />
        </Tabs.Tab>
        <Tabs.Tab title="RAG 检索" key="rag">
          <Rag />
        </Tabs.Tab>
      </Tabs>
    </div>
  );
};

export default LocalModelView;
