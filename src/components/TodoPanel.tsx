import React, { useState } from "react";
import { Checkbox } from "tdesign-mobile-react";
import { v4 as uuidv4 } from "uuid";
import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/Nautilus.css";

const TodoPanel: React.FC = () => {
  const [newTask, setNewTask] = useState("");
  const { getTasksByDate, toggleTaskById, removeTaskById, addTaskToPlan, defaultPlanId, getTaskById } = usePlanStore();

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

  return (
    <div className="todo-panel">
      <h2 className="panel-title">Tasks</h2>
      <div className="add-todo-form">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyUp={handleKeyPress} type="text" placeholder="Add a new task..." className="todo-input" />
        <button onClick={handleAddTask} className="add-button">
          Add
        </button>
      </div>
      <div className="progress-container">
        <div className="progress-info">
          <span>
            Progress: {completedCount} of {tasks.length}
          </span>
          <span>{Math.round((completedCount / Math.max(tasks.length, 1)) * 100)}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${(completedCount / Math.max(tasks.length, 1)) * 100}%` }}></div>
        </div>
      </div>
      <div className="todo-list-container">
        {tasks.length > 0 ? (
          <div className="todo-list">
            {tasks.map((task, index) => (
              <div key={index} className="todo-item">
                <Checkbox icon="rectangle" defaultChecked={getTaskById(task.id)?.completed} onChange={() => toggleTaskById(task.id)} />

                <span className={`todo-text ${task.completed ? "completed" : ""}`}>
                  {task.name}
                  {task.date && ` 🗓️ ${new Date(task.date).toLocaleDateString()}`}
                </span>
                <div className="todo-actions">
                  <button onClick={() => removeTaskById(task.id)} className="todo-action-button delete-button">
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
