import "../styles/components/CalendarModal.css";
import { usePlanStore } from "../store/taskStore";
import { useState } from "react";

interface CalendarModalProps {
  open: boolean;
  selectedDate: Date | null;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  selectedDate,
  onClose,
}) => {
  const removeTaskById = usePlanStore((state) => state.removeTaskById);
  const getTasksByDate = usePlanStore((state) => state.getTasksByDate);
  const addTaskToPlan = usePlanStore((state) => state.addTaskToPlan);
  const getPlanByDate = usePlanStore((state) => state.getPlanByDate);

  // 控制新建任务弹窗
  const [showCreate, setShowCreate] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [modelChange, setModelChange] = useState(0);

  const handleDelete = (taskId: string) => {
    removeTaskById(taskId);
    setModelChange((s) => s + 1);
  };

  const handleCreateTask = () => {
    setShowCreate(true);
    setNewTaskName("");
  };

  const handleSaveTask = () => {
    if (!selectedDate || !newTaskName.trim()) return;

    console.log("假装添加")
    setShowCreate(false);
    setModelChange((s) => s + 1);
  };

  const tasks = selectedDate ? getTasksByDate(selectedDate) : [];

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
        </button>
        {/* 新建任务按钮 */}
        <button
          className="modal-create-task"
          onClick={handleCreateTask}
        >
          新建任务
        </button>
        {selectedDate ? (
          <div className="modal-body">
            <h3 className="modal-title">
              {selectedDate.toLocaleDateString("zh-CN")} 的任务
            </h3>
            {tasks.length === 0 ? (
              <div className="modal-empty">这一天没有任务</div>
            ) : (
              <ul className="modal-task-list">
                {tasks.map((task) => (
                  <li key={task.id} className="modal-task-item">
                    <div className="modal-task-header">
                      <strong className="modal-task-name">{task.name}</strong>
                      <span
                        className={`modal-task-status ${
                          task.completed ? "completed" : "pending"
                        }`}
                      >
                        {task.completed ? "已完成" : "未完成"}
                      </span>
                      <button
                        className="modal-task-delete"
                        onClick={() => handleDelete(task.id)}
                        title="删除任务"
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="modal-empty">请选择日期</div>
        )}

        {/* 新建任务弹窗 */}
        {showCreate && (
          <div className="modal-overlay modal-create-overlay">
            <div className="modal-content modal-create-content">
              <h3 className="modal-title">新建任务</h3>
              <input
                className="modal-input"
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="请输入任务名称"
                autoFocus
              />
              <div style={{ marginTop: 16, textAlign: "right" }}>
                <button
                  className="modal-btn"
                  onClick={() => setShowCreate(false)}
                  style={{ marginRight: 8 }}
                >
                  取消
                </button>
                <button
                  className="modal-btn"
                  onClick={handleSaveTask}
                  disabled={!newTaskName.trim()}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;
