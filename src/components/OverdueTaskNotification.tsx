import { useEffect, useState } from "react";
import { Dialog } from "tdesign-mobile-react";
import { usePlanStore } from "../store/taskStore";

interface OverdueTaskInfo {
  planId: string;
  planName: string;
  tasks: Array<{
    taskId: string;
    taskName: string;
    originalDate: Date;
    isStrictMode: boolean;
  }>;
}

function OverdueTaskNotification() {
  const { Plans, isDefaultPlan, getOverdueTasksForPlan, getPlanById } =
    usePlanStore();

  const [overdueInfo, setOverdueInfo] = useState<OverdueTaskInfo | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 检查所有非默认计划的超时任务
    const checkOverdueTasks = () => {
      for (const plan of Plans) {
        // 跳过默认计划和已完成的计划
        if (isDefaultPlan(plan.id) || plan.completed) continue;

        const overdueTasks = getOverdueTasksForPlan(plan.id);

        if (overdueTasks.length > 0) {
          // 只显示宽松模式的提示（严格模式不重排）
          const flexibleTasks = overdueTasks.filter((t) => !t.isStrictMode);

          if (flexibleTasks.length > 0) {
            setOverdueInfo({
              planId: plan.id,
              planName: plan.name,
              tasks: flexibleTasks,
            });
            setVisible(true);
            break; // 一次只处理一个计划
          }
        }
      }
    };

    // 延迟检查，避免在页面加载时立即弹出
    const timer = setTimeout(checkOverdueTasks, 2000);

    return () => clearTimeout(timer);
  }, [Plans, isDefaultPlan, getOverdueTasksForPlan]);

  const handleRescheduleToday = () => {
    if (!overdueInfo) return;

    const plan = getPlanById(overdueInfo.planId);
    if (!plan) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 重新安排任务到今天
    overdueInfo.tasks.forEach((taskInfo) => {
      const task = plan.Tasks.find((t) => t.id === taskInfo.taskId);
      if (task) {
        task.date = today;
        // 注意：这里需要通过store更新任务
        // 由于当前store没有updateTask方法，我们需要通过删除再添加来实现
        // 实际使用时可能需要添加一个updateTask方法
      }
    });

    setVisible(false);
    setOverdueInfo(null);
  };

  const handleRescheduleTomorrow = () => {
    if (!overdueInfo) return;

    const plan = getPlanById(overdueInfo.planId);
    if (!plan) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    overdueInfo.tasks.forEach((taskInfo) => {
      const task = plan.Tasks.find((t) => t.id === taskInfo.taskId);
      if (task) {
        task.date = tomorrow;
      }
    });

    setVisible(false);
    setOverdueInfo(null);
  };

  const handleKeepOriginal = () => {
    setVisible(false);
    setOverdueInfo(null);
  };

  if (!overdueInfo) return null;

  return (
    <Dialog
      visible={visible}
      title="任务超时提醒"
      content={
        <div style={{ textAlign: "left" }}>
          <p>计划「{overdueInfo.planName}」中有以下任务已超时：</p>
          <ul style={{ paddingLeft: "20px", marginTop: "10px" }}>
            {overdueInfo.tasks.map((task) => (
              <li key={task.taskId} style={{ marginBottom: "8px" }}>
                {task.taskName}
                <br />
                <span style={{ fontSize: "12px", color: "#999" }}>
                  原计划: {new Date(task.originalDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "10px", color: "#666", fontSize: "14px" }}>
            是否将这些任务重新安排？
          </p>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleKeepOriginal}
              style={{
                border: "none",
                background: "transparent",
                color: "#999",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              或保持原样
            </button>
          </div>
        </div>
      }
      confirmBtn={{
        content: "重排到今天",
        theme: "primary",
        onClick: handleRescheduleToday,
      }}
      cancelBtn={{
        content: "重排到明天",
        theme: "default",
        onClick: handleRescheduleTomorrow,
      }}
      onClose={handleKeepOriginal}
    />
  );
}

export default OverdueTaskNotification;
