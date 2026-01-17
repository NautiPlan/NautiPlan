import { useState } from "react";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/CalendarModal.css";
import { Picker } from "antd-mobile";

interface CalendarModalProps {
  open: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  modelChange: number;
  setModelChange: React.Dispatch<React.SetStateAction<number>>;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  selectedDate,
  onClose,
  setModelChange,
}) => {
  const removeTaskById = usePlanStore((state) => state.removeTaskById);
  const getTasksByDate = usePlanStore((state) => state.getTasksByDate);
  const addTaskToPlan = usePlanStore((state) => state.addTaskToPlan);
  const plans = usePlanStore((state) => state.Plans);

  // 控制新建任务弹窗
  const [showCreate, setShowCreate] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  // 新增：选择计划
  const [selectedPlanId, setSelectedPlanId] = useState(
    plans.length > 0 ? plans[0].id : ""
  );
  const [planPickerVisible, setPlanPickerVisible] = useState(false);

  const handleDelete = (taskId: string) => {
    removeTaskById(taskId);
    setModelChange((s) => s + 1);
  };

  const handleCreateTask = () => {
    setShowCreate(true);
    setNewTaskName("");
    setSelectedPlanId(plans.length > 0 ? plans[0].id : "");
  };

  const handleSaveTask = () => {
    if (!selectedDate || !newTaskName.trim() || !selectedPlanId) return;
    addTaskToPlan(selectedPlanId, {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      date: selectedDate,
      completed: false,
      planId: selectedPlanId,
    });
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
        <button className="modal-create-task" onClick={handleCreateTask}>
          新建任务
        </button>
        {selectedDate ? (
          <>
            <div className="modal-title">
              <div className="modal-title-date">
                {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                {selectedDate.getDate()}日
              </div>
              <div className="modal-title-subtitle">任务列表</div>
            </div>
            <div className="modal-body">
              {tasks.length === 0 ? (
                <div className="modal-empty">这一天没有任务</div>
              ) : (
                <ul className="modal-task-list">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className={`modal-task-item ${
                        task.completed ? "completed" : "pending"
                      }`}
                    >
                      <div className="modal-task-header">
                        <div className="modal-task-main">
                          <div className="modal-task-name">{task.name}</div>
                          <span
                            className={`modal-task-status ${
                              task.completed ? "completed" : "pending"
                            }`}
                          >
                            {task.completed ? "已完成" : "未完成"}
                          </span>
                        </div>
                        <div className="modal-task-actions">
                          <button
                            className="modal-task-delete"
                            onClick={() => handleDelete(task.id)}
                            title="删除任务"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="modal-empty">请选择日期</div>
        )}

        {/* 新建任务弹窗 */}
        {showCreate && (
          <div className="modal-overlay modal-create-overlay">
            <div className="modal-content modal-create-content">
              <button
                className="modal-close"
                onClick={() => setShowCreate(false)}
              >
                &times;
              </button>
              <h3 className="modal-title">新建任务</h3>
              <div className="modal-body">
                {/* 下拉选择计划 */}
                <div
                  className="modal-select-trigger"
                  onClick={() => setPlanPickerVisible(true)}
                >
                  {plans.find((p) => p.id === selectedPlanId)?.name ||
                    "请选择计划"}
                </div>
                <Picker
                  columns={[
                    plans.map((plan) => ({
                      label: plan.name,
                      value: plan.id,
                    })),
                  ]}
                  visible={planPickerVisible}
                  onClose={() => setPlanPickerVisible(false)}
                  value={[selectedPlanId]}
                  onConfirm={(v) => {
                    if (v && v[0]) {
                      setSelectedPlanId(v[0] as string);
                    }
                  }}
                />
                <input
                  className="modal-input"
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="请输入任务名称"
                  autoFocus
                />
                <div className="modal-button-container">
                  <button
                    className="modal-btn modal-button-spacing"
                    onClick={() => setShowCreate(false)}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;
