import React, { useEffect, useRef, useMemo } from "react";
import { Button } from "antd-mobile";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useTimerStore } from "../store/timerStore";
import "../styles/components/Nautilus.css";

const TimerPanel: React.FC = () => {
  const {
    timerMode,
    timer,
    isRunning,
    isInCircleMode,
    circleIndex,
    circlePattern,
    // lastRunTimestamp,
    setTimerMode,
    startTimer,
    pauseTimer,
    resetTimer,
    circleTimer,
    // tickTimer,
    nextInCircleMode,
    updateLastRunTimestamp,
    exitCircleMode, // 添加退出Circle模式的函数引用
    startTimerInterval,
    stopTimerInterval,
  } = useTimerStore();

  const checkTimerIntervalRef = useRef<number | null>(null);

  // 获取模式的显示名称
  const getModeDisplayName = (mode: string) => {
    const modeNames: Record<string, string> = {
      pomodoro: "Focus",
      shortBreak: "Short",
      longBreak: "Long",
    };
    return modeNames[mode] || mode;
  };

  // 计算进度百分比
  const getTotalSeconds = (mode: string) => {
    switch (mode) {
      case "pomodoro":
        return 25 * 60; // 25分钟
      case "shortBreak":
        return 5 * 60; // 5分钟
      case "longBreak":
        return 15 * 60; // 15分钟
      default:
        return 25 * 60;
    }
  };

  const totalSeconds = useMemo(() => getTotalSeconds(timerMode), [timerMode]);
  const percentage = useMemo(
    () => ((totalSeconds - timer) / totalSeconds) * 100,
    [timer, totalSeconds]
  );

  // 获取进度条颜色
  const getPathColor = () => {
    switch (timerMode) {
      case "pomodoro":
        return "#ef4444"; // 红色 - Focus
      case "shortBreak":
        return "#22c55e"; // 绿色 - Short Break
      case "longBreak":
        return "#3b82f6"; // 蓝色 - Long Break
      default:
        return "#ef4444";
    }
  };

  // 格式化时间为 mm:ss，用于时钟
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 处理计时器结束
  const handleTimerComplete = () => {
    pauseTimer();

    // 如果在循环模式，启动下一个计时器
    if (useTimerStore.getState().isInCircleMode) {
      const currentState = useTimerStore.getState();

      // 检查是否到达了循环模式的最后一个阶段
      if (currentState.circleIndex >= currentState.circlePattern.length - 1) {
        // 如果是最后一个阶段，退出循环模式
        exitCircleMode();
      } else {
        // 否则进入下一个阶段
        setTimeout(() => {
          nextInCircleMode();
          startTimer();
          startTimerInterval();
        }, 1000);
      }
    }
  };

  // 启动计时器
  const handleStartTimer = () => {
    if (isRunning) return;

    startTimer();
    startTimerInterval();
  };

  // 暂停计时器
  const handlePauseTimer = () => {
    if (!isRunning) return;

    pauseTimer();

    stopTimerInterval();
  };

  // 重置计时器
  const handleResetTimer = () => {
    handlePauseTimer();
    resetTimer();
  };

  // 启动循环模式
  const handleCircleTimer = () => {
    if (checkTimerIntervalRef.current !== null) {
      clearInterval(checkTimerIntervalRef.current);
    }

    circleTimer();
    handleStartTimer();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentState = useTimerStore.getState();

      if (document.hidden) {
        // 页面切出，记录当前时间
        updateLastRunTimestamp(Date.now());
      } else {
        // 页面切回
        if (currentState.isRunning && currentState.lastRunTimestamp) {
          const now = Date.now();
          const elapsedSeconds = Math.floor(
            (now - currentState.lastRunTimestamp) / 1000
          );

          if (elapsedSeconds > 0 && currentState.timer > 0) {
            const newTime = Math.max(0, currentState.timer - elapsedSeconds);

            // 更新 timer
            useTimerStore.getState().setTimer(newTime);

            // 如果时间归零，触发完成
            if (newTime <= 0) {
              handleTimerComplete();
            }
          }

          // 重启计时器
          startTimerInterval();
          updateLastRunTimestamp(now);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 卸载时移除
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="timer-panel">
      <h2 className="panel-title">Timer</h2>
      <div className="timer-display-container">
        <div
          style={{ width: "180px", height: "180px" }}
          className={`timer-progress-wrapper ${isRunning ? "running" : ""}`}
        >
          <CircularProgressbar
            value={percentage}
            text={formatTime(timer)}
            styles={buildStyles({
              rotation: 0,
              strokeLinecap: "round",
              textSize: "24px",
              pathTransitionDuration: 0.5,
              pathColor: getPathColor(),
              textColor: "#1f2937",
              trailColor: "#e5e7eb",
            })}
          />
        </div>
      </div>
      <div className="timer-status-container">
        <div className="current-mode-status">
          <span className="status-label">Current Mode :</span>
          <span className={`status-value ${timerMode}`}>
            {getModeDisplayName(timerMode)}
          </span>
        </div>
        <div className="circle-mode-status">
          <span className="status-label">Circle Mode:</span>
          <span className={`status-value ${isInCircleMode ? "active" : ""}`}>
            {isInCircleMode ? "On" : "Off"}
          </span>
        </div>
        {isInCircleMode && (
          <div className="circle-pattern-status">
            <span className="status-label">Circle Progress:</span>
            <span className="status-value">
              {circleIndex + 1}/{circlePattern.length} -{" "}
              {getModeDisplayName(circlePattern[circleIndex])}
            </span>
          </div>
        )}
      </div>
      <div className="timer-mode-buttons">
        <Button
          onClick={() => {
            setTimerMode("pomodoro");
          }}
          className={`mode-button ${timerMode === "pomodoro" ? "active" : ""}`}
          color={timerMode === "pomodoro" ? "primary" : "default"}
          fill={timerMode === "pomodoro" ? "solid" : "outline"}
        >
          Focus
        </Button>
        <Button
          onClick={() => {
            setTimerMode("shortBreak");
          }}
          className={`mode-button ${
            timerMode === "shortBreak" ? "active" : ""
          }`}
          color={timerMode === "shortBreak" ? "primary" : "default"}
          fill={timerMode === "shortBreak" ? "solid" : "outline"}
        >
          Short
        </Button>
        <Button
          onClick={() => {
            setTimerMode("longBreak");
          }}
          className={`mode-button ${timerMode === "longBreak" ? "active" : ""}`}
          color={timerMode === "longBreak" ? "primary" : "default"}
          fill={timerMode === "longBreak" ? "solid" : "outline"}
        >
          Long
        </Button>
      </div>
      <div className="timer-control-buttons">
        <Button
          onClick={handleStartTimer}
          className="control-button start-button"
          disabled={isRunning}
          color="success"
        >
          Start
        </Button>
        <Button
          onClick={handlePauseTimer}
          className="control-button pause-button"
          disabled={!isRunning}
          color="warning"
        >
          Pause
        </Button>
        <Button
          onClick={handleResetTimer}
          className="control-button reset-button"
          color="default"
        >
          Reset
        </Button>
      </div>
      <div className="timer-control-buttons">
        <Button
          onClick={handleCircleTimer}
          className="control-button circle-button"
          color="primary"
        >
          Start a circle
        </Button>
      </div>
    </div>
  );
};

export default TimerPanel;
