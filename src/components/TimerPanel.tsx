import React, { useEffect, useRef } from "react";
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
        lastRunTimestamp,
        setTimerMode,
        startTimer,
        pauseTimer,
        resetTimer,
        circleTimer,
        tickTimer,
        nextInCircleMode,
        updateLastRunTimestamp,
        exitCircleMode,// 添加退出Circle模式的函数引用
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

    // 格式化时间为 mm:ss，用于时钟
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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

        // 如果在Circle模式中，也退出Circle模式
        if (isInCircleMode) {
            exitCircleMode();
        }
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
                    const elapsedSeconds = Math.floor((now - currentState.lastRunTimestamp) / 1000);

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
                <div className={`timer-display ${timerMode}`}>{formatTime(timer)}</div>
            </div>
            <div className="timer-status-container">
                <div className="current-mode-status">
                    <span className="status-label">Current Mode :</span>
                    <span className={`status-value ${timerMode}`}>{getModeDisplayName(timerMode)}</span>
                </div>
                <div className="circle-mode-status">
                    <span className="status-label">Circle Mode:</span>
                    <span className={`status-value ${isInCircleMode ? "active" : ""}`}>{isInCircleMode ? "On" : "Off"}</span>
                </div>
                {isInCircleMode && (
                    <div className="circle-pattern-status">
                        <span className="status-label">Circle Progress:</span>
                        <span className="status-value">
                            {circleIndex + 1}/{circlePattern.length} - {getModeDisplayName(circlePattern[circleIndex])}
                        </span>
                    </div>
                )}
            </div>
            <div className="timer-mode-buttons">
                <button onClick={() => { if (isInCircleMode) exitCircleMode(); setTimerMode("pomodoro"); }} className={`mode-button ${timerMode === "pomodoro" ? "active" : ""}`}>Focus</button>
                <button onClick={() => { if (isInCircleMode) exitCircleMode(); setTimerMode("shortBreak"); }} className={`mode-button ${timerMode === "shortBreak" ? "active" : ""}`}>Short</button>
                <button onClick={() => { if (isInCircleMode) exitCircleMode(); setTimerMode("longBreak"); }} className={`mode-button ${timerMode === "longBreak" ? "active" : ""}`}>Long</button>
            </div>
            <div className="timer-control-buttons">
                <button onClick={handleStartTimer} className="control-button start-button" disabled={isRunning}>Start</button>
                <button onClick={handlePauseTimer} className="control-button pause-button" disabled={!isRunning}>Pause</button>
                <button onClick={handleResetTimer} className="control-button reset-button">Reset</button>
            </div>
            <div className="timer-control-buttons">
                <button onClick={handleCircleTimer} className="control-button circle-button">Start a circle</button>
            </div>
        </div>
    );
};

export default TimerPanel;
