import { fetch } from "@tauri-apps/plugin-http";
import { v4 as uuidv4 } from "uuid";
import { genSignHeaders } from "./auth";

// 配置常量
const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/vivogpt/completions";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";

// AI接口
interface VivoGptRequestData {
  prompt: string;
  model?: string;
}

interface VivoGptResponse {
  code: number;
  message?: string;
  data?: {
    content: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
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

  console.log("requestId:", params.requestId);

  // 设置默认值
  const requestData = {
    prompt: data.prompt,
    systemPrompt: "你是一个AI日程管理助手，你会得到一段描述信息，你需要针对要求，分析潜在任务，任务难度等因素合理安排用户日常，以JSON方式为我安排计划，参考以下样例" + '{\n  "id": "plan-001",\n  "name": "项目开发计划",\n  "startDate": "2023-10-01T00:00:00.000Z",\n  "dueDate": "2023-10-31T23:59:59.000Z",\n  "priority": 1,\n  "completed": false,\n  "Tasks": [\n    {\n      "id": "task-001",\n      "name": "需求分析",\n      "date": "2023-10-01T00:00:00.000Z",\n      "completed": true\n    },\n    {\n      "id": "task-002",\n      "name": "原型设计",\n      "date": "2023-10-05T00:00:00.000Z",\n      "completed": true\n    },\n    {\n      "id": "task-003",\n      "name": "开发实现\\n(包含子任务)",\n      "date": "2023-10-10T00:00:00.000Z",\n      "completed": false\n    },\n    {\n      "id": "task-004",\n      "name": "测试\\t验收",\n      "date": "2023-10-25T00:00:00.000Z",\n      "completed": false\n    }\n  ]\n}',
    model: data.model || "vivo-BlueLM-TB-Pro",
    sessionId: uuidv4(),
    extra: {
      temperature: 0.9,
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
        const content = resObj.data.content;
        return content;
      } else {
        console.error("API错误:", resObj.message || "未知错误");
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
