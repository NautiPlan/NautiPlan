import { useEffect, useState } from "react";
import { Popup } from "tdesign-mobile-react";
import { Button as TButton } from "tdesign-mobile-react";
import { Card, Space } from "antd-mobile";
import {
  ExclamationCircleOutline,
  ClockCircleOutline,
} from "antd-mobile-icons";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/OverdueTaskNotification.css";

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
  const {
    Plans,
    isDefaultPlan,
    getOverdueTasksForPlan,
    getPlanById,
    updateTaskDate,
  } = usePlanStore();

  const [allOverduePlans, setAllOverduePlans] = useState<OverdueTaskInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // 当前显示的计划
  const currentOverdueInfo = allOverduePlans[currentIndex] || null;

  useEffect(() => {
    // 检查所有非默认计划的超时任务
    const checkOverdueTasks = () => {
      const overduePlansFound: OverdueTaskInfo[] = [];

      for (const plan of Plans) {
        // 跳过默认计划和已完成的计划
        if (isDefaultPlan(plan.id) || plan.completed) continue;

        const overdueTasks = getOverdueTasksForPlan(plan.id);

        if (overdueTasks.length > 0) {
          // 只显示宽松模式的提示（严格模式不重排）
          const flexibleTasks = overdueTasks.filter((t) => !t.isStrictMode);

          if (flexibleTasks.length > 0) {
            overduePlansFound.push({
              planId: plan.id,
              planName: plan.name,
              tasks: flexibleTasks,
            });
          }
        }
      }

      // 如果有超时计划,显示第一个
      if (overduePlansFound.length > 0) {
        setAllOverduePlans(overduePlansFound);
        setCurrentIndex(0);
        setVisible(true);
      }
    };

    // 延迟检查，避免在页面加载时立即弹出
    const timer = setTimeout(checkOverdueTasks, 2000);

    return () => clearTimeout(timer);
  }, [Plans, isDefaultPlan, getOverdueTasksForPlan]);

  const handleRescheduleToday = async () => {
    if (!currentOverdueInfo) return;

    const plan = getPlanById(currentOverdueInfo.planId);
    if (!plan) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 重新安排任务到今天，并更新数据库
    await Promise.all(
      currentOverdueInfo.tasks.map((taskInfo) =>
        updateTaskDate(taskInfo.taskId, today)
      )
    );

    // 处理完当前计划，显示下一个
    handleNextPlan();
  };

  const handleRescheduleTomorrow = async () => {
    if (!currentOverdueInfo) return;

    const plan = getPlanById(currentOverdueInfo.planId);
    if (!plan) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 重新安排任务到明天，并更新数据库
    await Promise.all(
      currentOverdueInfo.tasks.map((taskInfo) =>
        updateTaskDate(taskInfo.taskId, tomorrow)
      )
    );

    // 处理完当前计划，显示下一个
    handleNextPlan();
  };

  const handleKeepOriginal = () => {
    // 保持原样，直接显示下一个计划
    handleNextPlan();
  };

  // 显示下一个超时计划，如果没有了则关闭弹框
  const handleNextPlan = () => {
    if (currentIndex < allOverduePlans.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setVisible(false);
      setAllOverduePlans([]);
      setCurrentIndex(0);
    }
  };

  if (!currentOverdueInfo) return null;

  return (
    <Popup
      visible={visible}
      onVisibleChange={setVisible}
      placement="center"
      className="overdue-notification-popup"
    >
      <Card className="overdue-notification-card">
        <Space direction="vertical" style={{ width: "100%" }} block>
          <div className="overdue-header">
            <ExclamationCircleOutline className="overdue-icon" />
            <div className="overdue-title">任务超时提醒</div>
            {allOverduePlans.length > 1 && (
              <div className="overdue-pagination">
                {currentIndex + 1} / {allOverduePlans.length}
              </div>
            )}
          </div>

          <Card className="overdue-plan-card">
            <div className="overdue-plan-name">
              <ExclamationCircleOutline className="overdue-plan-icon" />
              计划「{currentOverdueInfo.planName}」
            </div>
          </Card>

          <Space direction="vertical" className="overdue-tasks-container" block>
            {currentOverdueInfo.tasks.map((task) => (
              <div key={task.taskId} className="overdue-task-item">
                <div className="overdue-task-name">{task.taskName}</div>
                <div className="overdue-task-date">
                  <ClockCircleOutline className="overdue-task-date-icon" />
                  原计划: {new Date(task.originalDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </Space>

          <div className="overdue-question">是否将这些任务重新安排？</div>

          <div className="overdue-actions">
            <TButton
              theme="primary"
              className="overdue-button-primary"
              onClick={handleRescheduleToday}
            >
              重排到今天
            </TButton>

            <TButton
              theme="default"
              className="overdue-button-secondary"
              onClick={handleRescheduleTomorrow}
            >
              重排到明天
            </TButton>

            <TButton
              variant="text"
              className="overdue-button-text"
              onClick={handleKeepOriginal}
            >
              {allOverduePlans.length > 1
                ? `跳过 (还有${allOverduePlans.length - currentIndex - 1}个计划)`
                : "保持原样"}
            </TButton>
          </div>
        </Space>
      </Card>
    </Popup>
  );
}

export default OverdueTaskNotification;
