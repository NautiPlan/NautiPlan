import { useEffect, useState } from "react";
import { InfoCircleFilledIcon } from "tdesign-icons-react";
import {
  Button as TButton, // Alias TDesign Button
  Calendar,
  Cell,
  Empty,
  Input,
  List,
  Popup,
} from "tdesign-mobile-react";
import { Tag } from "antd-mobile";
import Pagination from "./Pagination";
import { v4 as uuidv4 } from "uuid";
import { Plan, Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import { getPlanModeInfo, hasOverdueTasks } from "../utils/priority";
import "../styles/components/PlanList.css";

interface PlanListProps {
  onPlanClick?: (plan: Plan) => void;
  showCompleted?: boolean;
}

function PlanList({ onPlanClick }: PlanListProps) {
  const {
    Plans,
    removePlan,
    isDefaultPlan,
    removeTaskById,
    addTaskToPlan,
    getPlansWithDynamicPriority,
  } = usePlanStore();
  const [filteredPlans, setFilteredPlans] = useState<
    Array<Plan & { dynamicPriority: number }>
  >([]);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [visible, setVisible] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    // 获取带动态优先级的计划列表
    let plansWithPriority = getPlansWithDynamicPriority();

    // 根据筛选条件过滤
    if (filter === "completed") {
      plansWithPriority = plansWithPriority.filter((plan) => plan.completed);
    } else if (filter === "pending") {
      plansWithPriority = plansWithPriority.filter((plan) => !plan.completed);
    }

    // 排序：默认计划置顶，其他按动态优先级从高到低排序
    const sorted = plansWithPriority.sort((a, b) => {
      const isADefault = isDefaultPlan(a.id);
      const isBDefault = isDefaultPlan(b.id);

      // 默认计划始终置顶
      if (isADefault && !isBDefault) return -1;
      if (!isADefault && isBDefault) return 1;

      // 其他计划按动态优先级降序排列（高优先级在前）
      if (b.dynamicPriority !== a.dynamicPriority) {
        return b.dynamicPriority - a.dynamicPriority;
      }

      // 优先级相同时，未截止的计划排在前面
      const now = new Date();
      const aOverdue = a.dueDate ? now > a.dueDate : false;
      const bOverdue = b.dueDate ? now > b.dueDate : false;

      if (aOverdue !== bOverdue) {
        return aOverdue ? 1 : -1; // 未截止的(false)排在前面
      }

      // 都未截止或都已截止，按截止日期升序（最近的在前）
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      return 0;
    });

    setFilteredPlans(sorted);
    setCurrentPage(1);
  }, [Plans, filter, isDefaultPlan, getPlansWithDynamicPriority]);

  const totalPages = Math.ceil(filteredPlans.length / pageSize);
  const currentPlans = filteredPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatDate = (date: Date | null) => {
    if (!date) return "无";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "danger";
    if (priority >= 50) return "warning";
    return "success";
  };

  const getPriorityText = (priority: number) => {
    if (priority >= 80) return "高优先级";
    if (priority >= 50) return "中优先级";
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
    setManageMode(false);
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

  // 添加任务逻辑
  const [addTaskVisible, setAddTaskVisible] = useState(false);
  const handleAddTaskBTN = () => {
    setAddTaskVisible(true);
  };
  const handleAddTaskVisibleChange = (visible: boolean) => {
    setDataNote("");
    setTaskName("");
    setDateValue(null);
    setAddTaskVisible(visible);
  };

  // 日期选择
  const [dataNote, setDataNote] = useState("");
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [dateVisible, setDateVisible] = useState(false);
  const format = (val: Date) => {
    const date = new Date(val);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };
  const handleConfirm = (val: Date) => {
    setDateValue(val);
    setDataNote(format(val));
    setDateVisible(false);
  };
  const onClose = () => {
    setDateVisible(false);
  };

  // 任务名称
  const [taskName, setTaskName] = useState("");
  const onTaskNameChange = (value: any) => {
    const stringValue = String(value);
    setTaskName(stringValue);
  };

  // 提交任务
  const handleAddTask = () => {
    // 验证任务名称不为空
    const trimmedTaskName = taskName.trim();
    if (!selectedPlan || !trimmedTaskName || !dataNote) return;

    const newTask: Task = {
      id: uuidv4(),
      name: trimmedTaskName,
      date: dateValue!,
      completed: false,
      planId: selectedPlan.id,
    };

    addTaskToPlan(selectedPlan.id, newTask);

    setSelectedPlan((prev) => ({
      ...prev!,
      Tasks: [...(prev?.Tasks || []), newTask],
    }));

    handleAddTaskVisibleChange(false);
  };
  return (
    <div className="plan-list-container">
      {/* 筛选按钮 */}
      <div className="plan-list-filters">
        <TButton
          size="small"
          theme="default"
          style={
            filter === "all"
              ? {
                  backgroundColor: "#e6f4ff",
                  borderColor: "#91caff",
                  color: "#0958d9",
                }
              : {}
          }
          onClick={() => setFilter("all")}
        >
          全部 ({Plans.length})
        </TButton>
        <TButton
          size="small"
          theme={filter === "pending" ? "default" : "default"}
          style={
            filter === "pending"
              ? {
                  backgroundColor: "#fffbe6",
                  borderColor: "#ffe58f",
                  color: "#d48806",
                }
              : {}
          }
          onClick={() => setFilter("pending")}
        >
          进行中 ({Plans.filter((p) => !p.completed).length})
        </TButton>
        <TButton
          size="small"
          theme={filter === "completed" ? "default" : "default"}
          style={
            filter === "completed"
              ? {
                  backgroundColor: "#f6ffed",
                  borderColor: "#b7eb8f",
                  color: "#389e0d",
                }
              : {}
          }
          onClick={() => setFilter("completed")}
        >
          已完成 ({Plans.filter((p) => p.completed).length})
        </TButton>
      </div>

      {/* 可滚动的列表区域 */}
      <div className="plan-list-scroll-area">
        <List>
          {currentPlans.map((plan) => {
            const tasks = getTasks(plan);
            const completedTasks = tasks.filter((t) => t.completed);
            const isDefault = isDefaultPlan(plan.id);

            // 获取计划模式信息
            const modeInfo = isDefault ? null : getPlanModeInfo(plan);
            const hasOverdue = !isDefault && hasOverdueTasks(plan);

            // 使用动态优先级显示（默认计划除外）
            const displayPriority = isDefault
              ? plan.priority
              : plan.dynamicPriority;

            // 根据优先级获取边框颜色
            const getBorderColor = (priority: number) => {
              if (priority >= 80) return "#ffccc7"; // 浅红色 - 高优先级
              if (priority >= 50) return "#ffe58f"; // 浅黄色 - 中优先级
              return "#b7eb8f"; // 浅绿色 - 低优先级
            };

            return (
              <Cell
                key={plan.id}
                style={{
                  margin: "8px 4px",
                  borderRadius: "12px",
                  border: `2px solid ${getBorderColor(displayPriority)}`,
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                }}
                title={
                  <div className="plan-item-title">
                    <span className="plan-name">{plan.name}</span>
                    <div className="plan-tags">
                      <Tag color={getPriorityColor(displayPriority)}>
                        {getPriorityText(displayPriority)}
                      </Tag>
                      {plan.completed && <Tag color="success">已完成</Tag>}
                      {modeInfo && modeInfo.isStrict && (
                        <Tag color="danger" fill="outline">
                          严格
                        </Tag>
                      )}
                      {modeInfo && !modeInfo.isStrict && (
                        <Tag color="default" fill="outline">
                          宽松
                        </Tag>
                      )}
                      {hasOverdue && <Tag color="warning">超时</Tag>}
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
                    {modeInfo && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#999",
                          marginTop: "4px",
                        }}
                      >
                        {modeInfo.description}
                      </div>
                    )}
                  </div>
                }
                arrow
                onClick={() => handlePlanClick(plan)}
              />
            );
          })}
        </List>

        {filteredPlans.length === 0 && filter !== "all" && (
          <Empty
            description={
              filter === "completed" ? "暂无已完成的计划" : "暂无进行中的计划"
            }
          />
        )}

        {/* Pagination Control */}
        {filteredPlans.length > pageSize && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <Popup
        visible={visible}
        onVisibleChange={handleVisibleChange}
        placement="bottom"
        className="task-popup"
      >
        <div className="tdesign-mobile-popup-demo__with-title header">
          <div className="task-popup-header">
            <div className="task-title">
              <span>任务列表</span>
              {selectedPlan && (
                <span className="task-count">
                  共{getTasks(selectedPlan).length}个任务
                </span>
              )}
            </div>
            <div className="task-action-button" onClick={handleManageClick}>
              {manageMode ? "完成" : "管理"}
            </div>

            {selectedPlan && !isDefaultPlan(selectedPlan.id) && (
              <div
                className="task-remove"
                onClick={() => selectedPlan && handleRemovePlan(selectedPlan)}
              >
                删除计划
              </div>
            )}
          </div>
        </div>
        {selectedPlan && (
          <div className="task-popup-content task-popup-body">
            <div className="task-plan-info">
              <div className="task-plan-name">{selectedPlan.name}</div>
              <div className="task-plan-dates">
                <span>开始: {formatDate(selectedPlan.startDate)}</span>
                <span>截止: {formatDate(selectedPlan.dueDate)}</span>
              </div>
            </div>
            {getTasks(selectedPlan).length === 0 ? (
              <Empty description="暂无任务" />
            ) : (
              <List>
                {getTasks(selectedPlan).map((task) => (
                  <Cell
                    key={task.id}
                    className={`task-cell ${task.completed ? "completed" : ""}`}
                    title={
                      <div className="task-cell-title">
                        <span className="task-name">{task.name}</span>
                        <div className="task-delete-container">
                          <button
                            className={`delete-button ${!manageMode ? "hidden" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTaskById(task.id);
                              setSelectedPlan((prev) => ({
                                ...prev!,
                                Tasks:
                                  prev?.Tasks?.filter(
                                    (t) => t.id !== task.id
                                  ) || [],
                              }));
                            }}
                          >
                            －
                          </button>
                        </div>
                      </div>
                    }
                    description={
                      <div className="task-description">
                        {task.completed ? (
                          <Tag color="success">已完成</Tag>
                        ) : (
                          <Tag color="default">待完成</Tag>
                        )}
                        <span>日期: {formatDate(task.date)}</span>
                      </div>
                    }
                  />
                ))}
              </List>
            )}
            {manageMode && (
              <div className="add-task-container">
                <TButton
                  size="large"
                  theme="primary"
                  variant="text"
                  className="add-task-button"
                  onClick={() => handleAddTaskBTN()}
                >
                  +
                </TButton>
              </div>
            )}
          </div>
        )}
      </Popup>
      <Popup
        visible={addTaskVisible}
        onVisibleChange={handleAddTaskVisibleChange}
        placement="bottom"
        className="add-task-popup"
      >
        <div className="add-task-title">添加任务</div>
        <div className="add-task-input">
          <Input
            placeholder="请输入任务名"
            value={taskName}
            onChange={onTaskNameChange}
          />
        </div>
        <div className="add-task-input">
          <div>
            <Calendar
              visible={dateVisible}
              onConfirm={handleConfirm}
              onClose={onClose}
              className="add-task-date-cell"
            ></Calendar>
            <Cell
              title="单个选择日期"
              arrow
              note={dataNote}
              onClick={() => setDateVisible(true)}
            ></Cell>
          </div>
        </div>
        <div className="add-task-btn">
          <TButton
            theme="primary"
            className="add-task-button"
            onClick={() => {
              handleAddTask();
              setAddTaskVisible(false);
            }}
          >
            提交
          </TButton>
        </div>
      </Popup>
    </div>
  );
}

export default PlanList;
