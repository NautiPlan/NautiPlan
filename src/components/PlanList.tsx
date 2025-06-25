import { useEffect, useState } from "react";
import { InfoCircleFilledIcon } from "tdesign-icons-react";
import { Button, Cell, Empty, List, Tag } from "tdesign-mobile-react";
import { Plan } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/PlanList.css";

interface PlanListProps {
  onPlanClick?: (plan: Plan) => void;
  showCompleted?: boolean;
}

function PlanList({ onPlanClick }: PlanListProps) {
  const { Plans } = usePlanStore();
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

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

  const formatDate = (date: Date) => {
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
    if (onPlanClick) {
      onPlanClick(plan);
    }
  };

  const getTasks = (plan: Plan) => {
    return plan.Tasks || [];
  };

  if (Plans.length === 0) {
    return (
      <div className="plan-list-container">
        <Empty icon={<InfoCircleFilledIcon />} description="暂无任务" />;
      </div>
    );
  }

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

      {/* 计划列表 */}
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
                        ✓ 已完成
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
              //   删除按钮
              arrow
              onClick={() => handlePlanClick(plan)}
            />
          );
        })}
      </List>

      {filteredPlans.length === 0 && filter !== "all" && <Empty description={filter === "completed" ? "暂无已完成的计划" : "暂无进行中的计划"} />}
    </div>
  );
}

export default PlanList;
