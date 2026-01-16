import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { invoke } from "@tauri-apps/api/core";
import TabBarBase from "./components/TabBarBase";
import AIPlannerView from "./pages/AIPlannerView";
import CalendarView from "./pages/CalendarView";
import PlanView from "./pages/PlanView";
import TodoView from "./pages/TodoView";
import { usePlanStore } from "./store/taskStore";
import "./styles/components/transitions.css";
import ApiKeyButton from "./components/ApiKey";

// ============ 插件测试函数 ============
async function testInferencePlugin() {
  console.log("[PluginTest] 开始测试 taskpilot-inference 插件...");

  try {
    // 1. 检查 LLM 状态
    const llmStatus = await invoke<{ initialized: boolean }>(
      "plugin:taskpilot-inference|llm_status"
    );
    console.log("[PluginTest] LLM 状态:", llmStatus);

    // 2. 检查 Embedding 状态
    const embStatus = await invoke<{ initialized: boolean }>(
      "plugin:taskpilot-inference|embedding_status"
    );
    console.log("[PluginTest] Embedding 状态:", embStatus);

    // 3. 检查 RAG 状态
    const ragStatus = await invoke<{ initialized: boolean }>(
      "plugin:taskpilot-inference|rag_status"
    );
    console.log("[PluginTest] RAG 状态:", ragStatus);

    console.log("[PluginTest] ✅ 插件命令调用成功（状态查询）");

    // 如果需要测试初始化，取消下面注释并提供正确路径：
    // await invoke("plugin:taskpilot-inference|llm_init", {
    //   payload: { configPath: "/path/to/llm_config.json" }
    // });
    // console.log("[PluginTest] LLM 初始化成功");
  } catch (error) {
    console.error("[PluginTest] ❌ 插件调用失败:", error);
  }
}
// ============ 插件测试结束 ============

const pages = ["/", "/calendar", "/chat", "/myPlan"];

function App() {
  const { syncToDatabase } = usePlanStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [direction, setDirection] = useState("forward");
  const prevLocationIndex = useRef(pages.indexOf(location.pathname));

  const [showApiKey, setShowApiKey] = useState(false);
  const isSwipingFromTop = useRef(false);

  useEffect(() => {
    syncToDatabase();

    // 启动时测试插件（暂时禁用，排查闪退）
    if (import.meta.env.DEV) {
      testInferencePlugin();
    }
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
