import { Route, Routes } from "react-router-dom";
import TabBarBase from "./components/TabBarBase";
import AIPlannerView from "./pages/AIPlannerView";
import CalendarView from "./pages/CalendarView";
import TodoView from "./pages/TodoView";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/chat" element={<AIPlannerView />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/" element={<TodoView />} />
      </Routes>
      <TabBarBase />
    </div>
  );
}

export default App;
