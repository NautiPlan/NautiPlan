import React, { useRef, useState } from "react";
import { Checkbox } from "tdesign-mobile-react";
import { v4 as uuidv4 } from "uuid";
import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/Nautilus.css";

const TodoPanel: React.FC = () => {
  const [newTask, setNewTask] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const taskTextRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const {
    getTasksByDate,
    toggleTaskById,
    removeTaskById,
    addTaskToPlan,
    defaultPlanId,
    getTaskById,
  } = usePlanStore();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasks: Task[] = getTasksByDate(new Date());

  const completedCount = tasks.filter((tasks) => tasks.completed).length;

  const handleAddTask = () => {
    const newTaskData: Task = {
      id: uuidv4(),
      name: newTask.trim(),
      date: today,
      completed: false,
      planId: defaultPlanId,
    };

    addTaskToPlan(defaultPlanId, newTaskData);
    setNewTask("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const textEl = taskTextRefs.current.get(taskId);
    const btnEl = deleteButtonRefs.current.get(taskId);

    if (!textEl || !btnEl) {
      removeTaskById(taskId);
      return;
    }

    const textRect = textEl.getBoundingClientRect();
    const btnRect = btnEl.getBoundingClientRect();

    // 创建飞行的克隆元素
    const flyingEl = document.createElement("div");
    flyingEl.className = "flying-task";
    flyingEl.textContent =
      textEl.querySelector(".todo-name")?.textContent || "";
    flyingEl.style.left = `${textRect.left}px`;
    flyingEl.style.top = `${textRect.top}px`;
    flyingEl.style.width = `${textRect.width}px`;

    // 计算目标位置（垃圾桶中心）
    const targetX =
      btnRect.left + btnRect.width / 2 - textRect.left - textRect.width / 2;
    const targetY =
      btnRect.top + btnRect.height / 2 - textRect.top - textRect.height / 2;

    flyingEl.style.setProperty("--target-x", `${targetX}px`);
    flyingEl.style.setProperty("--target-y", `${targetY}px`);

    document.body.appendChild(flyingEl);

    setDeletingTaskId(taskId);

    // 动画结束后删除
    setTimeout(() => {
      flyingEl.remove();
      removeTaskById(taskId);
      setDeletingTaskId(null);
    }, 600);
  };

  return (
    <div className="todo-panel">
      <h2 className="panel-title">Tasks</h2>
      <div className="add-todo-form">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyUp={handleKeyPress}
          type="text"
          placeholder="Add a new task..."
          className="todo-input"
        />
        <button onClick={handleAddTask} className="add-button">
          Add
        </button>
      </div>
      <div className="progress-container">
        <div className="progress-info">
          <span>
            Progress: {completedCount} of {tasks.length}
          </span>
          <span>
            {Math.round((completedCount / Math.max(tasks.length, 1)) * 100)}%
          </span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${(completedCount / Math.max(tasks.length, 1)) * 100}%`,
            }}
          ></div>
        </div>
      </div>
      <div className="todo-list-container">
        {tasks.length > 0 ? (
          <div className="todo-list">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={`todo-item ${
                  task.completed ? "completed" : "pending"
                } ${deletingTaskId === task.id ? "fly-to-trash" : ""}`}
              >
                <Checkbox
                  icon="rectangle"
                  defaultChecked={getTaskById(task.id)?.completed}
                  onChange={() => toggleTaskById(task.id)}
                />

                <div
                  ref={(el) => {
                    if (el) taskTextRefs.current.set(task.id, el);
                  }}
                  className={`todo-text ${task.completed ? "completed" : ""} ${
                    deletingTaskId === task.id ? "hiding" : ""
                  }`}
                >
                  <div className="todo-name">{task.name}</div>
                </div>
                <div className="todo-actions">
                  <button
                    ref={(el) => {
                      if (el) deleteButtonRefs.current.set(task.id, el);
                    }}
                    onClick={() => handleDeleteTask(task.id)}
                    className="todo-action-button delete-button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No tasks yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoPanel;
