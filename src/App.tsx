import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import TabBarBase from "./components/TabBarBase";
import AIPlannerView from "./pages/AIPlannerView";
import CalendarView from "./pages/CalendarView";
import PlanView from "./pages/PlanView";
import TodoView from "./pages/TodoView";
import { usePlanStore } from "./store/taskStore";
import "./styles/components/transitions.css";

const pages = ["/", "/calendar", "/chat", "/myPlan"];

function App() {
  const { syncToDatabase } = usePlanStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [direction, setDirection] = useState("forward");
  const prevLocationIndex = useRef(pages.indexOf(location.pathname));

  useEffect(() => {
    syncToDatabase();
  }, []);

  const getCurrentDirection = () => {
    const currentIndex = pages.indexOf(location.pathname);
    const previousIndex = prevLocationIndex.current;

    if (currentIndex > previousIndex) {
      return "forward";
    } else if (currentIndex < previousIndex) {
      return "backward";
    }
    return direction;
  };

  useEffect(() => {
    const currentIndex = pages.indexOf(location.pathname);
    const previousIndex = prevLocationIndex.current;

    if (currentIndex > previousIndex) {
      setDirection("forward");
    } else if (currentIndex < previousIndex) {
      setDirection("backward");
    }

    prevLocationIndex.current = currentIndex;
  }, [location]);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      // 在滑动过程中检测是否在 no-swipe 区域，如果是则不处理
      const target = eventData.event.target as HTMLElement;
      if (target.closest(".no-swipe")) {
        return;
      }
    },
    onSwipedLeft: (eventData) => {
      // 检查事件目标是否在 no-swipe 区域内
      const target = eventData.event.target as HTMLElement;
      if (target.closest(".no-swipe")) return;

      const currentIndex = pages.indexOf(location.pathname);
      if (currentIndex < pages.length - 1) {
        setDirection("forward");
        navigate(pages[currentIndex + 1]);
      }
    },
    onSwipedRight: (eventData) => {
      // 检查事件目标是否在 no-swipe 区域内
      const target = eventData.event.target as HTMLElement;
      if (target.closest(".no-swipe")) return;

      const currentIndex = pages.indexOf(location.pathname);
      if (currentIndex > 0) {
        setDirection("backward");
        navigate(pages[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: false,
    trackMouse: true,
  });

  return (
    <div className="App">
      <main className="app-content" {...handlers}>
        <TransitionGroup component="div">
          <CSSTransition
            key={location.pathname}
            classNames={`slide-${getCurrentDirection()}`}
            timeout={300}
          >
            <div className="page-container">
              <Routes location={location}>
                <Route path="/chat" element={<AIPlannerView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/myPlan" element={<PlanView />} />
                <Route path="/" element={<TodoView />} />
              </Routes>
            </div>
          </CSSTransition>
        </TransitionGroup>
      </main>
      <TabBarBase />
    </div>
  );
}

export default App;
