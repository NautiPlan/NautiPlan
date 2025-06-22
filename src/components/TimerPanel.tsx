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
    } = useTimerStore();

    const timerIntervalRef = useRef<number | null>(null);
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

    // 提取计时器间隔逻辑为单独函数
    const startTimerInterval = () => {
        if (timerIntervalRef.current !== null) {
            clearInterval(timerIntervalRef.current);
        }

        timerIntervalRef.current = window.setInterval(() => {
            if (useTimerStore.getState().timer > 0) {
                tickTimer();
            } else {
                handleTimerComplete();
            }
        }, 1000);
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
        if (timerIntervalRef.current !== null) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
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


    // 恢复计时器状态
    useEffect(() => {
        // 恢复之前运行的计时器状态
        if (isRunning && lastRunTimestamp) {
            // 计算经过的时间
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - lastRunTimestamp) / 1000);

            // 如果有经过的时间，减少计时器时间
            if (elapsedSeconds > 0 && timer > 0) {
                // 直接使用store的getState来避免闭包问题
                const currentTimer = useTimerStore.getState().timer;
                const newTime = Math.max(0, currentTimer - elapsedSeconds);

                // 使用立即执行的匿名函数来更新计时器状态
                (async () => {
                    // 每秒tick一次直到追上当前时间
                    for (let i = 0; i < elapsedSeconds && i < currentTimer; i++) {
                        tickTimer();
                        // 稍微延迟避免状态更新过快
                        await new Promise((resolve) => setTimeout(resolve, 1));
                    }

                    // 如果计时器归零，触发通知
                    if (newTime <= 0) {
                        handleTimerComplete();
                    } else {
                        // 否则继续运行计时器
                        startTimerInterval();
                    }
                })();
            } else {
                // 没有经过时间或计时器已结束，直接启动计时器
                startTimerInterval();
            }

            // 更新最后运行时间戳为当前时间
            updateLastRunTimestamp(now);
        }

        // 组件卸载时清除计时器
        return () => {
            if (timerIntervalRef.current !== null) {
                clearInterval(timerIntervalRef.current);
            }
            if (checkTimerIntervalRef.current !== null) {
                clearInterval(checkTimerIntervalRef.current);
            }
        };
    }, []); // 空依赖数组，仅在组件挂载时执行一次

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
