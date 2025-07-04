import { fetch } from "@tauri-apps/plugin-http";
import { v4 as uuidv4 } from "uuid";
import { VivoGptRequestData, VivoGptResponse } from "../interface/chat";
import { genSignHeaders } from "./auth";

// 配置常量
const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/vivogpt/completions";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";

const systemPromptBySystem = `你是一个AI日程管理助手，你会得到一段我的计划的相关描述，
你需要针对这段计划的相关描述，分解这个计划成多个子任务，通过完成这些子任务来完成这个计划，把这些子任务安排到每天去，注意一定要仔细地划分子任务
以JSON方式为我安排计划，你可以参考以下样例（假如我一共有20天时间）：
[
  {
    "id": "task-001",
    "name": "需求分析",
    "day": "1-2",
  },
  {
    "id": "task-002",
    "name": "原型设计",
    "day": "3-8",
  },
  {
    "id": "task-003",
    "name": "开发实现\n(包含子任务)",
    "day": "9-15",
  },
  {
    "id": "task-004",
    "name": "测试",
    "day": "16-20",
  }
]  
`;

type Task = {
  id: string;
  name: string;
  day: string;
};

type ScheduledTask = {
  date: string;
  task: string;
  id: string;
  completed: boolean;
};

/**
 * 根据任务数组和起始日期，生成带有具体日期的每日任务安排列表
 *
 * @param {Task[]} content - 任务数组，每个任务包含 id、name 和 day（"起始天数-结束天数"字符串）
 * @param {Date} startDate - 计划的起始日期，所有任务日期均基于此日期计算
 * @returns {ScheduledTask[]} 返回一个数组，每个元素代表某一天的具体任务，包含任务 id、名称、ISO格式的日期和完成状态
 *
 * 函数逻辑：
 * 1. 遍历每个任务，根据任务的 day 字段解析出开始和结束的相对天数
 * 2. 根据起始日期和相对天数计算出具体日期，时间部分设置为 UTC 零点，格式为 ISO 8601
 * 3. 对于任务跨度内的每一天，生成一条独立任务记录，完成状态初始设为 false
 * 4. 返回所有生成的每日任务组成的数组
 */
function generateTaskSchedule(content: Task[], startDate: Date): ScheduledTask[] {
  const schedule: ScheduledTask[] = [];

  content.forEach((task) => {
    const dayRange = task.day.split("-");
    const startDay = parseInt(dayRange[0], 10);
    const endDay = dayRange[1] ? parseInt(dayRange[1], 10) : startDay;

    for (let day = startDay; day <= endDay; day++) {
      const taskDate = new Date(startDate);
      taskDate.setUTCDate(startDate.getUTCDate() + day - 1);
      taskDate.setUTCHours(0, 0, 0, 0); // 确保是 T00:00:00.000Z

      schedule.push({
        id: task.id,
        task: task.name,
        date: taskDate.toISOString(), // 保留 ISO 全格式
        completed: false,
      });
    }
  });

  return schedule;
}

/**
 * 调用VivoGPT API
 * @param data 请求数据
 * @returns Promise<string | null> 返回AI生成的内容或null
 */
export async function callVivoGpt(data: VivoGptRequestData): Promise<string | null> {
  const params = {
    requestId: uuidv4(),
  };

  // console.log("requestId:", params.requestId);

  const promptObj = JSON.parse(data.prompt);
  const startDate = new Date(promptObj.startDate);
  const dueDate = new Date(promptObj.dueDate);
  const timeDiff = dueDate.getTime() - startDate.getTime();
  const daysAvailable = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const strPromot = `我的任务是 ${promptObj.name} , 我有${daysAvailable + 1}天去完成它，重要性是 ${promptObj.importance}，任务的描述是：${promptObj.taskDescription}`;

  // 设置默认值
  const requestData = {
    prompt: strPromot,
    systemPrompt: systemPromptBySystem,
    model: data.model || "vivo-BlueLM-TB-Pro",
    sessionId: uuidv4(),
    extra: {
      temperature: 0.1,
    },
  };

  try {
    // 生成签名头
    const signHeaders = genSignHeaders(APP_ID, APP_KEY, METHOD, URI, params);
    const headers = {
      ...signHeaders,
      "Content-Type": "application/json",
    };

    const url = `https://${DOMAIN}${URI}`;

    // 构建查询参数
    const queryParams = new URLSearchParams({
      requestId: params.requestId,
    });

    const response = await fetch(`${url}?${queryParams}`, {
      method: METHOD,
      headers,
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      const resObj: VivoGptResponse = await response.json();

      if (resObj.code === 0 && resObj.data) {
        const contentStr: string = resObj.data.content;
        const contentJson: Task[] = JSON.parse(contentStr);
        const startDate: Date = new Date(promptObj.startDate);

        const schedule = generateTaskSchedule(contentJson, startDate);

        const finalSchedule = {
          id: promptObj.id,
          name: promptObj.name,
          startDate: promptObj.startDate,
          dueDate: promptObj.dueDate,
          priority: promptObj.importance,
          completed: false, // 初始肯定是未完成
          Tasks: schedule.map((task) => ({
            id: task.id,
            name: task.task, // 这里 task.task 是任务名
            date: task.date, // ISO 格式
            completed: task.completed,
          })),
        };

        return JSON.stringify(finalSchedule, null, 2);
      } else {
        // console.error("API错误:", resObj.message || "未知错误");
        return null;
      }
    } else {
      const errorText = await response.text();
      console.error(`HTTP错误 ${response.status}:`, errorText);
      return null;
    }
  } catch (error) {
    console.error("请求失败:", error);
    return null;
  }
}

// 导出类型
export type { VivoGptRequestData, VivoGptResponse };
