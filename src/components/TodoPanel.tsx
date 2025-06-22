import React, { useState } from "react";
import { useTodoStore } from "../store/todoStore";
import "../styles/components/Nautilus.css";

const TodoPanel: React.FC = () => {
    const [newTodo, setNewTodo] = useState("");
    const { todos, addTodo, toggleTodo, removeTodo } = useTodoStore();

    const completedCount = todos.filter((todo) => todo.completed).length;

    // 处理添加待办事项
    const handleAddTodo = () => {
        const text = newTodo.trim();
        if (text) {
            addTodo(text);
            setNewTodo("");
        }
    };

    // 处理按键事件
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleAddTodo();
        }
    };

    return (
        <div className="todo-panel">
            <h2 className="panel-title">Tasks</h2>
            <div className="add-todo-form">
                <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyUp={handleKeyPress} type="text" placeholder="Add a new task..." className="todo-input" />
                <button onClick={handleAddTodo} className="add-button">Add</button>
            </div>
            <div className="progress-container">
                <div className="progress-info">
                    <span>Progress: {completedCount} of {todos.length}</span>
                    <span>{Math.round((completedCount / Math.max(todos.length, 1)) * 100)}%</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${(completedCount / Math.max(todos.length, 1)) * 100}%` }}></div>
                </div>
            </div>
            <div className="todo-list-container">
                {todos.length > 0 ? (
                    <div className="todo-list">
                        {todos.map((todo, index) => (
                            <div key={index} className="todo-item">
                                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(index)} className="todo-checkbox" />
                                <span className={`todo-text ${todo.completed ? "completed" : ""}`}>
                                    {todo.text}
                                    {todo.createdAt && ` 🗓️ ${new Date(todo.createdAt).toLocaleDateString()}`}
                                </span>
                                <div className="todo-actions">
                                    <button onClick={() => removeTodo(index)} className="todo-action-button delete-button">🗑️</button>
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
