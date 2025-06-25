import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import TabBarBase from "./components/TabBarBase";
import AIPlannerView from "./pages/AIPlannerView";
import CalendarView from "./pages/CalendarView";
import PlanView from "./pages/PlanView";
import TodoView from "./pages/TodoView";
import { loadDatabase } from "./utils/database";

function App() {
  useEffect(() => {
    loadDatabase().catch(console.error);
  }, []);
  return (
    <div className="App">
      <Routes>
        <Route path="/chat" element={<AIPlannerView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/myPlan" element={<PlanView />} />
        <Route path="/" element={<TodoView />} />
      </Routes>
      <TabBarBase />
    </div>
  );
}

export default App;
