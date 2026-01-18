import {
  ReportRequestData,
  MonthlyReportData,
  TaskSummary,
} from "../interface/report";
import { usePlanStore } from "../store/taskStore";
import { Task } from "../interface/task";
import { invoke } from "@tauri-apps/api/core";

function formatTasksForPrompt(tasks: TaskSummary[]): string {
  if (!tasks || tasks.length === 0) {
    return "本月没有记录任何任务。";
  }
  return tasks
    .map(
      (task) =>
        `- 任务: "${task.title}" (分类: ${task.category}, 状态: ${
          task.status
        }, 完成度: ${
          task.completionRate * 100
        }%, 花费时间: ${task.timeSpent.toFixed(2)}小时)`
    )
    .join("\n");
}

function buildReportPrompt(data: ReportRequestData): string {
  const { month, tasks, userGoals } = data;
  const tasksString = formatTasksForPrompt(tasks);

  const userGoalsString = userGoals
    ? `我的本月目标是：${userGoals}`
    : "我没有设定特别的月度目标。";

  return `
请你扮演一位专业的项目助理和数据分析师。
根据我提供的 ${month} 的任务数据和个人目标，为我生成一份详细的月度总结报告。

我的任务数据如下：
${tasksString}

${userGoalsString}

请你严格按照以下JSON格式返回你的分析报告，不要添加任何额外的解释或说明文字，直接输出JSON对象：
{
  "summary": "对本月整体表现的总结，大约100-150字。",
  "achievements": ["识别出的主要成就，以字符串数组形式列出，每项成就都是一个独立的字符串。", "例如：高效完成了多个重要任务。"],
  "challenges": ["识别出的主要挑战或困难，以字符串数组形式列出，每项挑战都是一个独立的字符串。", "例如：在某个类别的任务上花费时间过多。"],
  "recommendations": ["根据本月表现提出的具体改进建议，以字符串数组形式列出，每项建议都是一个独立的字符串。", "例如：建议下月尝试使用番茄工作法提高效率。"]
}
`;
}

/**
 * 从Zustand store中获取当前月份的任务并生成月度报告
 * @returns 生成的月度报告数据
 * @throws 如果API请求失败或返回格式不正确，则抛出错误
 */
export async function generateMonthlyReport(): Promise<
  Omit<
    MonthlyReportData,
    | "id"
    | "month"
    | "userId"
    | "createdAt"
    | "tasks"
    | "totalTasks"
    | "completedTasks"
    | "completionRate"
    | "totalTimeSpent"
  >
> {
  // 从store获取数据
  const { Plans, getPlanByTaskId } = usePlanStore.getState();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 筛选当前月份的所有任务
  const allTasks: Task[] = Plans.flatMap((plan) => plan.Tasks || []);
  const currentMonthTasks = allTasks.filter((task) => {
    const taskDate = new Date(task.date);
    return (
      taskDate.getFullYear() === currentYear &&
      taskDate.getMonth() === currentMonth
    );
  });

  // 将Task转换为TaskSummary
  const taskSummaries: TaskSummary[] = currentMonthTasks.map((task) => {
    const plan = getPlanByTaskId(task.id);
    return {
      taskId: task.id,
      title: task.name,
      status: task.completed ? "completed" : "in-progress",
      completionRate: task.completed ? 1 : 0, // 假设未完成的任务完成度为0
      timeSpent: 0, // Task接口中没有此字段，默认为0
      category: plan?.name || "未分类",
    };
  });

  const reportRequest: ReportRequestData = {
    month: `${currentYear}年${currentMonth + 1}月`,
    tasks: taskSummaries,
    // userGoals可以从其他地方获取，这里暂时留空
  };

  const prompt = buildReportPrompt(reportRequest);

  try {
    const response = await invoke<string>("aliyun_report", {
      prompt,
    });

    const reportContent = JSON.parse(response);

    if (
      !reportContent.summary ||
      !Array.isArray(reportContent.achievements) ||
      !Array.isArray(reportContent.challenges) ||
      !Array.isArray(reportContent.recommendations)
    ) {
      throw new Error("AI response does not match the expected format.");
    }

    return reportContent;
  } catch (error) {
    console.error("Failed to generate monthly report:", error);
    throw error;
  }
}
