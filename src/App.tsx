import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import TabBarBase from "./components/TabBarBase";
import AIPlannerView from "./pages/AIPlannerView";
import CalendarView from "./pages/CalendarView";
import PlanView from "./pages/PlanView";
import TodoView from "./pages/TodoView";
import { usePlanStore } from "./store/taskStore";

function App() {
  const { syncToDatabase } = usePlanStore();

  useEffect(() => {
    syncToDatabase();
  }, []); // 空依赖数组确保只执行一次

  return (
    <div className="App">
      <main className="app-content">
        <Routes>
          <Route path="/chat" element={<AIPlannerView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/myPlan" element={<PlanView />} />
          <Route path="/" element={<TodoView />} />
        </Routes>
      </main>
      <TabBarBase />
    </div>
  );
}

export default App;
