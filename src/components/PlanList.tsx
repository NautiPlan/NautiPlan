import { useEffect, useState } from "react";
import { InfoCircleFilledIcon } from "tdesign-icons-react";

import { Button, Cell, Empty, List, Popup, Tag } from "tdesign-mobile-react";
import { Plan } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/PlanList.css";

interface PlanListProps {
  onPlanClick?: (plan: Plan) => void;
  showCompleted?: boolean;
}

function PlanList({ onPlanClick }: PlanListProps) {
  const { Plans, removePlan, isDefaultPlan, removeTaskById } = usePlanStore();
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let filtered = Plans;

    if (filter === "completed") {
      filtered = Plans.filter((plan) => plan.completed);
    } else if (filter === "pending") {
      filtered = Plans.filter((plan) => !plan.completed);
    }

    filtered = filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    setFilteredPlans(filtered);
  }, [Plans, filter]);

  const formatDate = (date: Date | null) => {
    if (!date) return "无";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "danger";
    if (priority >= 5) return "warning";
    return "success";
  };

  const getPriorityText = (priority: number) => {
    if (priority >= 8) return "高优先级";
    if (priority >= 5) return "中优先级";
    return "低优先级";
  };

  const handlePlanClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setVisible(true);
    if (onPlanClick) {
      onPlanClick(plan);
    }
  };

  const getTasks = (plan: Plan) => {
    return plan.Tasks || [];
  };

  const handleVisibleChange = (visible: boolean) => {
    setVisible(visible);
    if (!visible) {
      setSelectedPlan(null);
    }
  };

  const handleRemovePlan = (plan: Plan) => {
    setVisible(false);
    removePlan(plan.id);
  };

  if (Plans.length === 0) {
    return (
      <div className="plan-list-container">
        <Empty icon={<InfoCircleFilledIcon />} description="暂无任务" />
      </div>
    );
  }

  // 状态管理
  const [manageMode, setManageMode] = useState(false);

  const handleManageClick = () => {
    setManageMode(!manageMode);
  };

  return (
    <div className="plan-list-container">
      {/* 筛选按钮 */}
      <div className="plan-list-filters">
        <Button size="small" theme={filter === "all" ? "primary" : "default"} onClick={() => setFilter("all")}>
          全部 ({Plans.length})
        </Button>
        <Button size="small" theme={filter === "pending" ? "primary" : "default"} onClick={() => setFilter("pending")}>
          进行中 ({Plans.filter((p) => !p.completed).length})
        </Button>
        <Button size="small" theme={filter === "completed" ? "primary" : "default"} onClick={() => setFilter("completed")}>
          已完成 ({Plans.filter((p) => p.completed).length})
        </Button>
      </div>

      {/* 可滚动的列表区域 */}
      <div className="plan-list-scroll-area">
        <List>
          {filteredPlans.map((plan) => {
            const tasks = getTasks(plan);
            const completedTasks = tasks.filter((t) => t.completed);

            return (
              <Cell
                key={plan.id}
                title={
                  <div className="plan-item-title">
                    <span className="plan-name">{plan.name}</span>
                    <div className="plan-tags">
                      <Tag theme={getPriorityColor(plan.priority)} size="small">
                        {getPriorityText(plan.priority)}
                      </Tag>
                      {plan.completed && (
                        <Tag theme="success" size="small">
                          已完成
                        </Tag>
                      )}
                    </div>
                  </div>
                }
                description={
                  <div className="plan-item-description">
                    <div className="plan-dates">
                      <span>开始: {formatDate(plan.startDate)}</span>
                      <span>截止: {formatDate(plan.dueDate)}</span>
                    </div>
                    <div className="plan-stats">
                      <span>任务数量: {tasks.length}</span>
                      {tasks.length > 0 && (
                        <span>
                          已完成: {completedTasks.length}/{tasks.length}
                        </span>
                      )}
                    </div>
                  </div>
                }
                arrow
                onClick={() => handlePlanClick(plan)}
              />
            );
          })}
        </List>

        {filteredPlans.length === 0 && filter !== "all" && <Empty description={filter === "completed" ? "暂无已完成的计划" : "暂无进行中的计划"} />}
      </div>

      <Popup visible={visible} onVisibleChange={handleVisibleChange} placement="bottom" style={{ height: "50%" }}>
        <div className="tdesign-mobile-popup-demo__with-title header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              className="task-title"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontWeight: "500",
              }}
            >
              任务列表
            </div>

            {selectedPlan && !isDefaultPlan(selectedPlan.id) && (
              <div className="task-remove" style={{ color: "#ff4757", cursor: "pointer" }} onClick={() => selectedPlan && handleRemovePlan(selectedPlan)}>
                删除计划
              </div>
            )}

            <div style={{ color: "#ff4757" }} onClick={handleManageClick}>
              管理
            </div>
          </div>
        </div>
        {selectedPlan && (
          <div
            style={{
              padding: "16px",
              height: "calc(100% - 60px)", // 减去头部高度
              overflowY: "auto", // 允许滚动
            }}
          >
            <div style={{ marginBottom: "12px", fontSize: "14px", color: "#666" }}>
              {selectedPlan.name} - 共{getTasks(selectedPlan).length}个任务
            </div>
            {getTasks(selectedPlan).length === 0 ? (
              <Empty description="暂无任务" />
            ) : (
              <List>
                {getTasks(selectedPlan).map((task) => (
                  <Cell
                    key={task.id}
                    title={
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{task.name}</span>
                          {task.completed ? (
                            <Tag theme="success" size="small">
                              已完成
                            </Tag>
                          ) : (
                            <Tag theme="default" size="small">
                              待完成
                            </Tag>
                          )}
                        </div>
                        {manageMode && (
                          <button
                            className="delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTaskById(task.id);
                              setSelectedPlan((prev) => ({
                                ...prev!,
                                Tasks: prev?.Tasks?.filter((t) => t.id !== task.id) || [],
                              }));
                            }}
                          >
                            —
                          </button>
                        )}
                      </>
                    }
                    description={`日期: ${formatDate(task.date)}`}
                  />
                ))}
              </List>
            )}
          </div>
        )}
      </Popup>
    </div>
  );
}

export default PlanList;
