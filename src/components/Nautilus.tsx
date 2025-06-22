import React from "react";
import TimerPanel from "./TimerPanel";
import TodoPanel from "./TodoPanel";
import "../styles/components/Nautilus.css";

const Nautilus: React.FC = () => {
    return (
        <div className="app-container">
            <div className="app-content">
                <div className="main-grid">
                    <TimerPanel />
                    <TodoPanel />
                </div>
            </div>
        </div>
    );
};

export default Nautilus;