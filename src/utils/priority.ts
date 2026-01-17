import { Plan } from "../interface/task";

/**
 * 获取日期的开始时间（00:00:00）
 */
function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 判断任务是否真正超时（今天之前的未完成任务）
 * 今天的任务不算超时，要等到明天才算
 */
function isTaskOverdue(taskDate: Date): boolean {
  const now = new Date();
  const today = getStartOfDay(now);
  const taskDay = getStartOfDay(taskDate);
  
  // 只有任务日期在今天之前才算超时
  return taskDay < today;
}

/**
 * 计算时间紧迫度评分 (0-35分)
 */
function calculateUrgencyScore(dueDate: Date | null): number {
  if (!dueDate) return 0;
  
  const now = new Date();
  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining <= 0) return 35; // 已过期或今天到期
  if (daysRemaining <= 1) return 33; // 明天到期
  if (daysRemaining <= 3) return 30; // 3天内
  if (daysRemaining <= 7) return 25; // 一周内
  if (daysRemaining <= 14) return 18; // 两周内
  if (daysRemaining <= 30) return 10; // 一个月内
  
  // 超过30天，线性递减
  return Math.max(0, 10 - (daysRemaining - 30) / 10);
}

/**
 * 计算进度偏离惩罚 (0-25分)
 */
function calculateProgressPenalty(plan: Plan): number {
  const totalTasks = plan.Tasks?.length || 0;
  
  if (totalTasks === 0) return 0;
  
  const completedTasks = plan.Tasks.filter(t => t.completed).length;
  const actualProgress = completedTasks / totalTasks; // 实际完成进度 0-1
  
  // 计算预期进度
  const now = new Date();
  const totalDuration = plan.dueDate 
    ? plan.dueDate.getTime() - plan.startDate.getTime()
    : 0;
  
  if (totalDuration <= 0) return 0;
  
  const elapsed = now.getTime() - plan.startDate.getTime();
  const expectedProgress = Math.min(1, Math.max(0, elapsed / totalDuration)); // 预期进度 0-1
  
  // 进度偏离 (正数表示落后，负数表示超前)
  const progressGap = expectedProgress - actualProgress;
  
  if (progressGap <= 0) return 0; // 没有落后，不惩罚
  
  // 落后程度转换为惩罚分数
  let penalty = progressGap * 25;
  
  // 检查是否有真正超时的未完成任务，额外惩罚
  const overdueTasks = plan.Tasks.filter(
    t => !t.completed && isTaskOverdue(t.date)
  );
  
  if (overdueTasks.length > 0) {
    penalty += Math.min(10, overdueTasks.length * 2);
  }
  
  return Math.min(35, penalty); // 最高35分（基础25 + 额外10）
}

/**
 * 计算超时处理加成 (0-20分)
 */
function calculateOvertimeBonus(plan: Plan): number {
  if (!plan.dueDate) return 0;
  
  const now = new Date();
  const daysRemaining = Math.ceil((plan.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  let bonus = 0;
  
  // 1. 计划整体超时加成
  if (daysRemaining < 0 && !plan.completed) {
    const overdueDays = Math.abs(daysRemaining);
    bonus += Math.min(15, overdueDays * 2); // 每超时1天+2分，最高15分
  }
  
  // 2. 超时任务加成（使用真正的超时判断）
  const overdueTasks = plan.Tasks.filter(
    t => !t.completed && isTaskOverdue(t.date)
  );
  
  if (overdueTasks.length > 0) {
    bonus += Math.min(10, overdueTasks.length * 3); // 每个超时任务+3分，最高10分
  }
  
  return Math.min(20, bonus);
}

/**
 * 判断是否采用严格模式
 * 严格模式：高重要度(≥70)或短期计划(≤7天)
 */
export function isStrictMode(plan: Plan): boolean {
  // 高重要度计划使用严格模式
  if (plan.priority >= 70) return true;
  
  // 短期计划使用严格模式
  if (plan.dueDate) {
    const duration = plan.dueDate.getTime() - plan.startDate.getTime();
    const days = duration / (1000 * 60 * 60 * 24);
    if (days <= 7) return true;
  }
  
  return false;
}

/**
 * 获取计划模式信息
 */
export function getPlanModeInfo(plan: Plan): {
  isStrict: boolean;
  reason: string;
  description: string;
} {
  const strict = isStrictMode(plan);
  
  if (strict) {
    // 判断是因为什么原因进入严格模式
    if (plan.priority >= 70) {
      if (plan.dueDate) {
        const duration = plan.dueDate.getTime() - plan.startDate.getTime();
        const days = Math.ceil(duration / (1000 * 60 * 60 * 24));
        if (days <= 7) {
          return {
            isStrict: true,
            reason: "高重要度 + 短期计划",
            description: `重要度${plan.priority}，周期${days}天，严格模式：超时任务不会自动重排`
          };
        }
      }
      return {
        isStrict: true,
        reason: "高重要度",
        description: `重要度${plan.priority}，严格模式：超时任务不会自动重排`
      };
    } else {
      const duration = plan.dueDate!.getTime() - plan.startDate.getTime();
      const days = Math.ceil(duration / (1000 * 60 * 60 * 24));
      return {
        isStrict: true,
        reason: "短期计划",
        description: `周期${days}天，严格模式：超时任务不会自动重排`
      };
    }
  }
  
  return {
    isStrict: false,
    reason: "宽松模式",
    description: "宽松模式：超时任务可重新安排"
  };
}

/**
 * 计算动态优先级
 * @param plan 计划对象
 * @returns 动态优先级 (0-100)
 */
export function calculateDynamicPriority(plan: Plan): number {
  // 如果计划已完成，优先级设为最低
  if (plan.completed) return 0;
  
  // 1. 基础重要度 (40%)
  const baseScore = plan.priority * 0.4;
  
  // 2. 时间紧迫度 (35%)
  const urgencyScore = calculateUrgencyScore(plan.dueDate);
  
  // 3. 进度偏离惩罚 (25%)
  const progressPenalty = calculateProgressPenalty(plan);
  
  // 4. 超时处理加成 (0-20)
  const overtimeBonus = calculateOvertimeBonus(plan);
  
  // 5. 综合计算
  const dynamicPriority = baseScore + urgencyScore + progressPenalty + overtimeBonus;
  
  return Math.round(Math.max(0, Math.min(100, dynamicPriority)));
}

/**
 * 获取需要重新安排的任务列表
 */
export function getTasksNeedReschedule(plan: Plan): Array<{
  taskId: string;
  taskName: string;
  originalDate: Date;
  isStrictMode: boolean;
}> {
  const strict = isStrictMode(plan);
  
  // 只选择真正超时的任务（今天之前的）
  const overdueTasks = plan.Tasks.filter(
    t => !t.completed && isTaskOverdue(t.date)
  );
  
  return overdueTasks.map(task => ({
    taskId: task.id,
    taskName: task.name,
    originalDate: task.date,
    isStrictMode: strict
  }));
}

/**
 * 获取动态优先级的显示信息
 */
export function getDynamicPriorityDisplay(dynamicPriority: number): {
  level: "high" | "medium" | "low";
  text: string;
  color: "danger" | "warning" | "success";
} {
  if (dynamicPriority >= 80) {
    return { level: "high", text: "高优先级", color: "danger" };
  }
  if (dynamicPriority >= 50) {
    return { level: "medium", text: "中优先级", color: "warning" };
  }
  return { level: "low", text: "低优先级", color: "success" };
}

/**
 * 检查计划是否有超时任务
 */
export function hasOverdueTasks(plan: Plan): boolean {
  return plan.Tasks.some(t => !t.completed && isTaskOverdue(t.date));
}

/**
 * 检查计划是否已超过截止日期
 */
export function isPlanOverdue(plan: Plan): boolean {
  if (!plan.dueDate) return false;
  const now = new Date();
  return now > plan.dueDate && !plan.completed;
}
