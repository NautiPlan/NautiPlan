// import React from "react";
// import Nautilus from "../components/Nautilus";

// const NautilusView: React.FC = () => {
//   return (
//     <div className="nautilus-view">
//       <Nautilus />
//     </div>
//   );
// };

// export default NautilusView;

import React from "react";
import TimerPanel from "../components/TimerPanel";
import TodoPanel from "../components/TodoPanel";
import "../styles/components/Nautilus.css";

const TodoView: React.FC = () => {
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

export default TodoView;