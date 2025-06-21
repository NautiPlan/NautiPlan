import { fetch } from "@tauri-apps/plugin-http";
import { v4 as uuidv4 } from "uuid";
import { genSignHeaders } from "./auth";

// 配置常量
const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/vivogpt/completions";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";

// 接口定义
interface VivoGptRequestData {
  prompt: string;
  model?: string;
  sessionId?: string;
  extra?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
  };
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
    model: data.model || "vivo-BlueLM-TB-Pro",
    sessionId: data.sessionId || uuidv4(),
    extra: {
      temperature: data.extra?.temperature || 0.9,
      ...data.extra,
    },
  };

  try {
    // 生成签名头
    const signHeaders = genSignHeaders(APP_ID, APP_KEY, METHOD, URI, params);
    const headers = {
      ...signHeaders,
      "Content-Type": "application/json",
    };

    const startTime = Date.now();
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

    const endTime = Date.now();
    const timeCost = (endTime - startTime) / 1000;

    if (response.ok) {
      const resObj: VivoGptResponse = await response.json();
      console.log("response:", resObj);

      if (resObj.code === 0 && resObj.data) {
        const content = resObj.data.content;
        console.log(`final content:\n${content}`);
        console.log(`请求耗时: ${timeCost.toFixed(2)}秒`);
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
