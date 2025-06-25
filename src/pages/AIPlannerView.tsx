import AIPlanner from "../components/AIPlanner";

function AIPlannerView() {
  return (
    <div className="ai-planner-view" style={{ height: "100vh", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
      <AIPlanner />
    </div>
  );
}

export default AIPlannerView;
