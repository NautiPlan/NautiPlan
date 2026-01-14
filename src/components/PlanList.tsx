import { useEffect, useState } from "react";
import { InfoCircleFilledIcon } from "tdesign-icons-react";
import {
  Button,
  Calendar,
  Cell,
  Empty,
  Input,
  List,
  Popup,
  Tag,
} from "tdesign-mobile-react";
import { v4 as uuidv4 } from "uuid";
import { Plan, Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import "../styles/components/PlanList.css";

interface PlanListProps {
  onPlanClick?: (plan: Plan) => void;
  showCompleted?: boolean;
}

function PlanList({ onPlanClick }: PlanListProps) {
  const { Plans, removePlan, isDefaultPlan, removeTaskById, addTaskToPlan } =
    usePlanStore();
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

    filtered = filtered.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    setFilteredPlans(filtered);
  }, [Plans, filter]);

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
    if (!selectedPlan || !taskName || !dataNote) return;

    const newTask: Task = {
      id: uuidv4(),
      name: taskName,
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
        <Button
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
        </Button>
        <Button
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
        </Button>
        <Button
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
        </Button>
      </div>

      {/* 可滚动的列表区域 */}
      <div className="plan-list-scroll-area">
        <List>
          {filteredPlans.map((plan) => {
            const tasks = getTasks(plan);
            const completedTasks = tasks.filter((t) => t.completed);

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
                  border: `2px solid ${getBorderColor(plan.priority)}`,
                  backgroundColor: "#fff",
                  boxSizing: "border-box",
                }}
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

        {filteredPlans.length === 0 && filter !== "all" && (
          <Empty
            description={
              filter === "completed" ? "暂无已完成的计划" : "暂无进行中的计划"
            }
          />
        )}
      </div>

      <Popup
        visible={visible}
        onVisibleChange={handleVisibleChange}
        placement="bottom"
        style={{ height: "50%", zIndex: 1000 }}
      >
        <div className="tdesign-mobile-popup-demo__with-title header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              className="task-title"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                fontWeight: "500",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span>任务列表</span>
              {selectedPlan && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    fontWeight: "normal",
                    marginTop: "2px",
                  }}
                >
                  共{getTasks(selectedPlan).length}个任务
                </span>
              )}
            </div>
            <div style={{ color: "#ff4757" }} onClick={handleManageClick}>
              {manageMode ? "完成" : "管理"}
            </div>

            {selectedPlan && !isDefaultPlan(selectedPlan.id) && (
              <div
                className="task-remove"
                style={{ color: "#ff4757", cursor: "pointer" }}
                onClick={() => selectedPlan && handleRemovePlan(selectedPlan)}
              >
                删除计划
              </div>
            )}
          </div>
        </div>
        {selectedPlan && (
          <div
            className="task-popup-content" // Added class for styling
            style={{
              padding: "16px",
              height: "calc(100% - 60px)", // 减去头部高度
              overflowY: "auto", // 允许滚动
            }}
          >
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)",
                borderRadius: "10px",
                borderLeft: "4px solid #91caff",
              }}
            >
              <div
                style={{ fontSize: "16px", fontWeight: "500", color: "#333" }}
              >
                {selectedPlan.name}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#888",
                  marginTop: "4px",
                  display: "flex",
                  gap: "12px",
                }}
              >
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
                    style={{
                      margin: "8px 0",
                      borderRadius: "10px",
                      border: `2px solid ${
                        task.completed ? "#b7eb8f" : "#ffccc7"
                      }`,
                      backgroundColor: "#fff",
                    }}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            wordBreak: "break-all",
                            whiteSpace: "pre-wrap",
                            marginRight: "8px",
                            textAlign: "left", // 确保文字左对齐
                          }}
                        >
                          {task.name}
                        </span>
                        <div
                          style={{
                            width: "40px",
                            minWidth: "40px",
                            flexShrink: 0,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          {manageMode && (
                            <button
                              className="delete-button"
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
                              —
                            </button>
                          )}
                        </div>
                      </div>
                    }
                    description={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {task.completed ? (
                          <Tag theme="success" size="small">
                            已完成
                          </Tag>
                        ) : (
                          <Tag theme="default" size="small">
                            待完成
                          </Tag>
                        )}
                        <span>日期: {formatDate(task.date)}</span>
                      </div>
                    }
                  />
                ))}
              </List>
            )}
            {manageMode && (
              <div
                className="add-task"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                <Button
                  size="large"
                  theme="primary"
                  variant="text"
                  style={{
                    width: "100%",
                    textAlign: "center",
                  }}
                  onClick={() => handleAddTaskBTN()}
                >
                  +
                </Button>
              </div>
            )}
          </div>
        )}
      </Popup>
      <Popup
        visible={addTaskVisible}
        onVisibleChange={handleAddTaskVisibleChange}
        placement="bottom"
        style={{ height: "50%", zIndex: 1001 }}
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
              style={{ zIndex: 1002 }}
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
          <Button
            theme="primary"
            style={{
              width: "100%",
              textAlign: "center",
            }}
            onClick={() => {
              handleAddTask();
              setAddTaskVisible(false);
            }}
          >
            提交
          </Button>
        </div>
      </Popup>
    </div>
  );
}

export default PlanList;
