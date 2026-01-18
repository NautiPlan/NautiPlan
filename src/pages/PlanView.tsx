import React from "react";
import PlanList from "../components/PlanList";
import Report from "../components/Report";
import OverdueTaskNotification from "../components/OverdueTaskNotification";
import "../styles/pages/PlanView.css";
import { useInferenceStore } from "../store/llmStore";

const NautilusView: React.FC = () => {
  const { onDeviceEnabled } = useInferenceStore();
  return (
    <div className="plan-view">
      <PlanList />
      {onDeviceEnabled ? <></> : <Report />}
      <OverdueTaskNotification />
    </div>
  );
};

export default NautilusView;
