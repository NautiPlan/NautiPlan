import { invoke } from "@tauri-apps/api/core";
import { generateTaskSchedule } from "./chat";

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

const fixPrompt = `请注意，只回答JSON格式的内容，不要包含任何其他文本或解释。确保JSON格式正确，且符合以上结构：`;

type Task = {
  id: string;
  name: string;
  day: string;
};

async function initModel() {
  try {
    const result = await invoke("init_bluelm");
    console.log("初始化结果:", result);
    return result;
  } catch (error) {
    console.error("初始化失败:", error);
    throw error;
  }
}

async function generateContent(prompt: string): Promise<string> {
  try {
    const result: string = await invoke("use_bluelm", { prompt });
    return result;
  } catch (error) {
    console.error("生成内容失败:", error);
    throw error;
  }
}

async function releaseModel() {
  try {
    const result = await invoke("release_bluelm");
    console.log("释放结果:", result);
    return result;
  } catch (error) {
    console.error("释放失败:", error);
    throw error;
  }
}

export async function callVivoEdgeGpt(data: string): Promise<string | null> {
  try {
    await initModel();

    const promptObj = JSON.parse(data);
    const startDate = new Date(promptObj.startDate);
    const dueDate = new Date(promptObj.dueDate);
    const timeDiff = dueDate.getTime() - startDate.getTime();
    const daysAvailable = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const strPromot = `我的任务是 ${promptObj.name} , 我有${daysAvailable + 1}天去完成它，重要性是 ${promptObj.importance}，任务的描述是：${promptObj.taskDescription}`;

    // 生成内容
    let resObj: string = await generateContent(systemPromptBySystem + fixPrompt + strPromot);
    const startIndex = resObj.indexOf("[");
    const endIndex = resObj.lastIndexOf("]");
    resObj = resObj.substring(startIndex, endIndex + 1).trim();
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      if (resObj.startsWith("{") && resObj.endsWith("}")) {
        resObj = "[" + resObj + "]";
      }
      console.error("生成的内容格式不正确:", resObj);
      await releaseModel();
      return null;
    }

    console.log("生成的内容:", resObj);

    let contentJson: Task[];
    try {
      contentJson = JSON.parse(resObj);
    } catch (parseError) {
      console.error("尝试修复转义字符:", parseError);
      try {
        // 尝试修复常见的转义字符问题
        const fixedResObj = resObj
          .replace(/\\\n/g, "\\n") // 修复换行符
          .replace(/\\\r/g, "\\r") // 修复回车符
          .replace(/\\\t/g, "\\t") // 修复制表符
          .replace(/\\\"/g, '\\"') // 修复引号
          .replace(/\\\\/g, "\\\\"); // 修复反斜杠

        contentJson = JSON.parse(fixedResObj);
      } catch (fixError) {
        console.error("修复转义字符后仍然解析失败:", fixError);
        await releaseModel();
        return null;
      }
    }

    const schedule = generateTaskSchedule(contentJson, startDate);

    const finalSchedule = {
      id: promptObj.id,
      name: promptObj.name,
      startDate: promptObj.startDate,
      dueDate: promptObj.dueDate,
      priority: promptObj.importance,
      completed: false,
      Tasks: schedule.map((task) => ({
        id: task.id,
        name: task.task,
        date: task.date,
        completed: task.completed,
      })),
    };

    await releaseModel();
    return JSON.stringify(finalSchedule, null, 2);
  } catch (error) {
    console.error("调用 VivoEdgeGpt 失败:", error);
    try {
      await releaseModel();
    } catch (releaseError) {
      console.error("释放模型失败:", releaseError);
    }
    return null;
  }
}
