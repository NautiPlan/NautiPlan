import React, { useRef, useState } from "react";
import { Checkbox } from "tdesign-mobile-react";
import { Button, Input, Space } from "antd-mobile";
import { AddOutline } from "antd-mobile-icons";
import { v4 as uuidv4 } from "uuid";
import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/Nautilus.css";
import Pagination from "./Pagination";

const TodoPanel: React.FC = () => {
  const [newTask, setNewTask] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const taskTextRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const deleteButtonRefs = useRef<Map<string, HTMLElement>>(new Map());
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

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(tasks.length / pageSize);
  const currentTasks = tasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const completedCount = tasks.filter((tasks) => tasks.completed).length;

  const handleAddTask = () => {
    // 验证任务名称不为空
    const trimmedTaskName = newTask.trim();
    if (!trimmedTaskName) return;

    const newTaskData: Task = {
      id: uuidv4(),
      name: trimmedTaskName,
      date: today,
      completed: false,
      planId: defaultPlanId,
    };

    addTaskToPlan(defaultPlanId, newTaskData);
    setNewTask("");
  };

  const handleDeleteTask = (taskId: string) => {
    const textEl = taskTextRefs.current.get(taskId);
    const btnEl = deleteButtonRefs.current.get(taskId);

    if (!textEl) {
      removeTaskById(taskId);
      return;
    }

    if (!btnEl) {
      // 如果没有按钮元素,直接删除(保证删除功能可用)
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
      <div className="add-todo-form-modern">
        <Space direction="vertical" block style={{ "--gap": "12px" }}>
          <Input
            value={newTask}
            onChange={(val) => setNewTask(val)}
            onEnterPress={handleAddTask}
            placeholder="What needs to be done today?"
            clearable
            style={{
              "--font-size": "15px",
              "--placeholder-color": "#999",
            }}
          />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              onClick={handleAddTask}
              color="primary"
              size="middle"
              disabled={!newTask.trim()}
              style={{
                "--border-radius": "8px",
                minWidth: "140px",
              }}
            >
              <Space style={{ "--gap": "6px" }}>
                <AddOutline fontSize={18} />
                <span>Add Task</span>
              </Space>
            </Button>
          </div>
        </Space>
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
            {currentTasks.map((task, index) => (
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
                  <div
                    ref={(el) => {
                      if (el) deleteButtonRefs.current.set(task.id, el);
                    }}
                  >
                    <Button
                      onClick={() => handleDeleteTask(task.id)}
                      className="delete-button"
                      fill="none"
                      size="mini"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No tasks for today</div>
        )}
      </div>

      {tasks.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default TodoPanel;
