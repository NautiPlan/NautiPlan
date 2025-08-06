import { fetch } from "@tauri-apps/plugin-http";
import { v4 as uuidv4 } from "uuid";
import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import { genSignHeaders } from "./auth";

const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/vivogpt/completions";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";
const webApiKey: string = import.meta.env.VITE_WebAPI_KEY;

function buildTaskQuery(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "如何提高工作效率和时间管理";
  }

  const taskNames = tasks.map((task) => task.name).join("、");
  return `我今天有以下任务：${taskNames}。请推荐相关的学习资料和提升方法。`;
}

// 使用蓝心70B模型进行查询改写
async function queryRewrite(query: string): Promise<string[]> {
  const params = {
    requestId: uuidv4(),
  };

  const requestData = {
    prompt: query,
    systemPrompt: '你是一个查询改写专家。请将用户的查询改写成3-5个不同角度的相关查询，这些查询应该能够帮助用户找到更全面的学习资料和提升方法。请以JSON数组格式返回，例如：["查询1", "查询2", "查询3"]',
    model: "vivo-BlueLM-TB-Pro",
    sessionId: uuidv4(),
    extra: {
      temperature: 0.3,
    },
  };

  try {
    const signHeaders = genSignHeaders(APP_ID, APP_KEY, METHOD, URI, params);
    const headers = {
      ...signHeaders,
      "Content-Type": "application/json",
    };

    const url = `https://${DOMAIN}${URI}`;
    const queryParams = new URLSearchParams({
      requestId: params.requestId,
    });

    const response = await fetch(`${url}?${queryParams}`, {
      method: METHOD,
      headers,
      body: JSON.stringify(requestData),
    });

    if (response.ok) {
      const resObj = await response.json();

      if (resObj.code === 0 && resObj.data) {
        const contentStr: string = resObj.data.content;
        const queries: string[] = JSON.parse(contentStr);
        return queries;
      } else {
        console.error("查询改写API错误:", resObj.message || "未知错误");
        return [query]; // 返回原查询作为fallback
      }
    } else {
      const errorText = await response.text();
      console.error(`查询改写HTTP错误 ${response.status}:`, errorText);
      return [query];
    }
  } catch (error) {
    console.error("查询改写请求失败:", error);
    return [query]; // 返回原查询作为fallback
  }
}

export async function recommendResources(date: Date) {
  try {
    const getTasksByDate = usePlanStore.getState().getTasksByDate;
    const tasks = getTasksByDate(date);

    const originalQuery = buildTaskQuery(tasks);

    // 调用查询改写API
    const rewrittenQueries = await queryRewrite(originalQuery);
    console.log("改写后的查询:", JSON.stringify(rewrittenQueries));

    // 调用搜索API
  } catch (error) {
    console.error("推荐资源生成失败:", error);
  }
}
