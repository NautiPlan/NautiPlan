import "../styles/components/CalendarModal.css";

interface CalendarModalProps {
  open: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  tasks: any[]; // 实际就是 Task[]
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  selectedDate,
  onClose,
  tasks,
}) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          &times;
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
                    </div>
                    {task.taskDescription && (
                      <div className="modal-task-desc">
                        {task.taskDescription}
                      </div>
                    )}
                    <div className="modal-task-meta">
                      <span>
                        开始:{" "}
                        {task.startDate
                          ? new Date(task.startDate).toLocaleString()
                          : "-"}
                      </span>
                      <span>
                        截止:{" "}
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleString()
                          : "-"}
                      </span>
                      {typeof task.importance === "number" && (
                        <span className="modal-task-importance">
                          重要性: {task.importance}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="modal-empty">请选择日期</div>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;
