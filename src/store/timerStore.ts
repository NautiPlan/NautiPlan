import { create } from "zustand";

// 定义计时器模式的常量
const TIMER_MODES = {
  POMODORO: "pomodoro",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

// 定义每种模式的默认时长（秒）
const DEFAULT_TIMES = {
  [TIMER_MODES.POMODORO]: 25 * 60, // 25分钟
  [TIMER_MODES.SHORT_BREAK]: 5 * 60, // 5分钟
  [TIMER_MODES.LONG_BREAK]: 15 * 60, // 15分钟
};

// 默认的循环模式
const DEFAULT_CIRCLE_PATTERN = [TIMER_MODES.POMODORO, TIMER_MODES.SHORT_BREAK, TIMER_MODES.POMODORO, TIMER_MODES.LONG_BREAK];

// 定义计时器存储的类型
interface TimerState {
  // 状态
  timerMode: string;
  timer: number;
  isRunning: boolean;
  isInCircleMode: boolean;
  circleIndex: number;
  circlePattern: string[];
  lastRunTimestamp: number | null;

  timerIntervalId: number | null; //存放 setInterval() 返回的 intervalId，用于后续 clearInterval() 时停止计时器

  // 操作
  setTimerMode: (mode: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;
  circleTimer: () => void;
  nextInCircleMode: () => void;
  updateLastRunTimestamp: (timestamp: number) => void;
  exitCircleMode: () => void; // 新增：退出Circle模式的函数
  setTimer: (newTime: number) => void;

  startTimerInterval: () => void; //定义一个函数，作用是启动计时器，用 setInterval() 每秒调用 tickTimer() 并把 intervalId 存进 timerIntervalId
  stopTimerInterval: () => void; // 定义一个函数，作用是停止计时器，用 clearInterval(timerIntervalId) 并把 timerIntervalId 置为 null
  handleTimerComplete: () => void;
}

// 创建计时器存储
export const useTimerStore = create<TimerState>()((set, get) => ({
  // 初始状态
  timerMode: TIMER_MODES.POMODORO,
  timer: DEFAULT_TIMES[TIMER_MODES.POMODORO],
  isRunning: false,
  isInCircleMode: false,
  circleIndex: 0,
  circlePattern: DEFAULT_CIRCLE_PATTERN,
  lastRunTimestamp: null,
  timerIntervalId: null,

  // 设置计时器模式
  setTimerMode: (mode) => {
    set({
      timerMode: mode,
      timer: DEFAULT_TIMES[mode] || DEFAULT_TIMES[TIMER_MODES.POMODORO],
      isRunning: false,
    });
  },

  // 开始计时器
  startTimer: () => {
    set(() => ({
      isRunning: true,
      lastRunTimestamp: Date.now(),
    }));
  },

  // 暂停计时器
  pauseTimer: () => {
    set({ isRunning: false, lastRunTimestamp: null });
  },

  // 重置计时器
  resetTimer: () => {
    const { timerMode } = get();
    set({
      timer: DEFAULT_TIMES[timerMode] || DEFAULT_TIMES[TIMER_MODES.POMODORO],
      isRunning: false,
      lastRunTimestamp: null,
    });
  },

  // 每秒递减计时器
  tickTimer: () => {
    set((state) => ({
      timer: Math.max(0, state.timer - 1),
    }));
  },

  // 启动循环模式
  circleTimer: () => {
    set({
      timerMode: DEFAULT_CIRCLE_PATTERN[0],
      timer: DEFAULT_TIMES[DEFAULT_CIRCLE_PATTERN[0]],
      isInCircleMode: true,
      circleIndex: 0,
    });
  },

  // 循环模式下进入下一个阶段
  nextInCircleMode: () => {
    set((state) => {
      // 计算下一个索引，如果超出范围则重置为0
      const nextIndex = (state.circleIndex + 1) % state.circlePattern.length;
      const nextMode = state.circlePattern[nextIndex];

      // 检查是否完成了整个循环周期
      const isCircleComplete = nextIndex === 0;

      return {
        circleIndex: nextIndex,
        timerMode: nextMode,
        timer: DEFAULT_TIMES[nextMode],
        // 如果完成了整个循环，退出循环模式
        isInCircleMode: !isCircleComplete,
      };
    });
  },

  // 更新最后运行时间戳
  updateLastRunTimestamp: (timestamp) => {
    set({ lastRunTimestamp: timestamp });
  },

  // 新增：退出Circle模式
  exitCircleMode: () => {
    // 保持当前模式，但退出循环状态
    // set((state) => ({
    //   isInCircleMode: false,
    //   circleIndex: 0,
    // }));
  },

  handleTimerComplete: () => {
    const state = get();
    state.pauseTimer();
    state.stopTimerInterval();

    if (state.isInCircleMode) {
      if (state.circleIndex >= state.circlePattern.length - 1) {
        state.exitCircleMode();
      } else {
        setTimeout(() => {
          const nextState = get();
          nextState.nextInCircleMode();
          nextState.startTimer();
          nextState.startTimerInterval();
        }, 1000);
      }
    }
  },

  startTimerInterval: () => {
    const { timerIntervalId } = get();
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
    }

    const intervalId = window.setInterval(() => {
      if (get().timer > 0) {
        get().tickTimer();
      } else {
        get().pauseTimer();
        get().stopTimerInterval();
        get().handleTimerComplete(); // 如果你把 handleTimerComplete 放进 store
      }
    }, 1000);

    set({ timerIntervalId: intervalId });
  },

  stopTimerInterval: () => {
    const { timerIntervalId } = get();
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
      set({ timerIntervalId: null });
    }
  },

  setTimer: (newTime) => set({ timer: newTime }),
}));
