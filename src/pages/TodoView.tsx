import React, { useEffect } from "react";
import TimerPanel from "../components/TimerPanel";
import TodoPanel from "../components/TodoPanel";
import "../styles/components/Nautilus.css";

const TodoView: React.FC = () => {
  useEffect(() => {
    // 仅保留强制刷新样式表的逻辑
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href.includes("Nautilus")) {
        link.setAttribute("href", href.split("?")[0] + "?v=" + Date.now());
      }
    });
  }, []);

  return (
    <div
      className="app-container"
      style={{
        height: "100vh",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="main-content"
        style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
        }}
      >
        <TimerPanel />
        <TodoPanel />
      </div>
    </div>
  );
};

export default TodoView;
