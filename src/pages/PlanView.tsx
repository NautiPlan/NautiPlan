import React from "react";
import PlanList from "../components/PlanList";
import "../styles/pages/PlanView.css";

const NautilusView: React.FC = () => {
  return (
    <div className="plan-view">
      <PlanList />
    </div>
  );
};

export default NautilusView;
