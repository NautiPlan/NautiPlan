import React from "react";
import PlanList from "../components/PlanList";
import Report from "../components/Report";
import "../styles/pages/PlanView.css";

const NautilusView: React.FC = () => {
  return (
    <div className="plan-view">
      <PlanList />
      <Report />
    </div>
  );
};

export default NautilusView;
