import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import TabBarBase from "./components/TabBarBase";
import AIPlannerView from "./pages/AIPlannerView";
import CalendarView from "./pages/CalendarView";
import PlanView from "./pages/PlanView";
import TodoView from "./pages/TodoView";
import LocalModelView from "./pages/LocalModelView";
import { usePlanStore } from "./store/taskStore";
import "./styles/components/transitions.css";
import ApiKeyButton from "./components/ApiKey";
import { useInferenceStore, InferenceConfig } from "./store/llmStore";

const pages = ["/", "/calendar", "/chat", "/myPlan", "/model"];

function App() {
  const { syncToDatabase } = usePlanStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [direction, setDirection] = useState("forward");
  const prevLocationIndex = useRef(pages.indexOf(location.pathname));

  const [showApiKey, setShowApiKey] = useState(false);
  const isSwipingFromTop = useRef(false);

  // 设置 llm 路径
  const { setConfig } = useInferenceStore();
  const cfg: InferenceConfig = {
    llmConfigPath:
      "data/local/tmp/models/Qwen2.5-1.5B-Instruct-MNN/llm_config.json",
    embeddingConfigPath:
      "data/local/tmp/models/bge-large-zh-MNN/llm_config.json",
    ragDbPath: "data/local/tmp/models/rag",
  };
  useEffect(() => {
    setConfig(cfg);
  }, []);

  useEffect(() => {
    syncToDatabase();
  }, []);

  // 手动监听 TouchStart 以确保在任何滑动发生前准确捕获滚动位置
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;

    // 寻找最近的滚动容器
    const scrollContainer = target.closest(".page-container");

    // 如果没有找到容器，或者没在容器内（防御性），则重置状态
    if (!scrollContainer) {
      isSwipingFromTop.current = false;
      return;
    }

    // 严格判断：只有当滚动条在顶部范围内（<20px，约0.5cm）才允许触发
    // 用户提到的 0~2cm 约为 0~75px，这里取较小值确保精准
    const st = scrollContainer.scrollTop;
    isSwipingFromTop.current = st < 20;
  };

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

    // 每次切换页面时，隐藏 Key 设置按钮
    setShowApiKey(false);

    if (currentIndex > previousIndex) {
      setDirection("forward");
    } else if (currentIndex < previousIndex) {
      setDirection("backward");
    }

    prevLocationIndex.current = currentIndex;
  }, [location]);

  const handlers = useSwipeable({
    // 移除 onSwipeStart，改用原生的 onTouchStart 更快更准
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
    onSwipedDown: (eventData) => {
      const target = eventData.event.target as HTMLElement;
      if (target.closest(".no-swipe")) return;

      // 只有起始位置在顶部，下拉才显示 API Key 设置
      if (isSwipingFromTop.current) {
        setShowApiKey(true);
      }
    },
    onSwipedUp: () => {
      setShowApiKey(false);
    },
    preventScrollOnSwipe: false,
    trackMouse: true,
  });

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 10) {
      setShowApiKey(false);
    }
  };

  return (
    <div className="App">
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          transition: "transform 0.3s ease-in-out",
          transform: showApiKey ? "translateY(0)" : "translateY(-100%)",
        }}
      >
        <ApiKeyButton defaultKeyName="ALIAPI_KEY" />
      </div>
      <main
        className="app-content"
        {...handlers}
        // 显式绑定 TouchStart 事件，并确保不覆盖 useSwipeable 的内部处理
        // 注意：useSwipeable 返回的 handlers 中包含了 onTouchStart，这里需要先解构再重写
        onTouchStart={(e) => {
          // 断言 handlers 为 any 以访问可能的 onTouchStart
          const swipeableTouchStart = (handlers as any).onTouchStart;
          if (swipeableTouchStart) swipeableTouchStart(e);
          handleTouchStart(e);
        }}
      >
        <TransitionGroup component="div">
          <CSSTransition
            key={location.pathname}
            classNames={`slide-${getCurrentDirection()}`}
            timeout={300}
          >
            <div className="page-container" onScroll={handleScroll}>
              <Routes location={location}>
                <Route path="/chat" element={<AIPlannerView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/myPlan" element={<PlanView />} />
                <Route path="/model" element={<LocalModelView />} />
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
