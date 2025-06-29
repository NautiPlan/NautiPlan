import React from "react";
import TimerPanel from "../components/TimerPanel";
import TodoPanel from "../components/TodoPanel";
import "../styles/components/Nautilus.css";

const TodoView: React.FC = () => {
  return (
    <>
      <TimerPanel />
      <TodoPanel />
    </>
  );
};

export default TodoView;
