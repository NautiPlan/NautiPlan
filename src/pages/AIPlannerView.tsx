import AIPlanner from "../components/AIPlanner";

function AIPlannerView() {
  return (
    <div
      className="ai-planner-view"
      style={{
        height: "100vh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecf1 100%)",
      }}
    >
      <AIPlanner />
    </div>
  );
}

export default AIPlannerView;
