import React from "react";
import TimerPanel from "../components/TimerPanel";
import TodoPanel from "../components/TodoPanel";
import "../styles/components/Nautilus.css";

const TodoView: React.FC = () => {
  return (
    <div
      className="app-container"
      style={{
        height: "auto",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <div
        className="app-content"
        style={{
          height: "auto",
          minHeight: "100%",
        }}
      >
        <div
          className="main-grid"
          style={{
            height: "auto",
            minHeight: "100%",
          }}
        >
          <TimerPanel />
          <TodoPanel />
        </div>
      </div>
    </div>
  );
};

export default TodoView;
