import { fetch } from "@tauri-apps/plugin-http";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { ImageMessage, VivoGptResponse } from "../interface/chat";
import FileWithMeta from "../interface/fileWithMeta";
import { genSignHeaders } from "./auth";

const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/vivogpt/completions";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";

export async function callVivoImageGpt(files: FileWithMeta[]): Promise<string | null> {
  const params = {
    requestId: uuidv4(),
  };

  let messages: ImageMessage[] = files.map((file) => {
    const wordArray = CryptoJS.lib.WordArray.create(file.buffer as ArrayBuffer);
    console.log("注意看", file.type);
    return {
      role: "user",
      content: "data:" + file.type + ";base64," + CryptoJS.enc.Base64.stringify(wordArray),
      contentType: "image",
    };
  });

  messages = [
    ...messages,
    {
      role: "user",
      content: "用简介的文字描述所有图片的内容，注意回答中仅描述图片的内容含义，不要包含对图片样式的描述。",
      contentType: "text",
    },
  ];

  const data = {
    sessionId: uuidv4(),
    requestId: params.requestId,
    model: "vivo-BlueLM-V-2.0",
    messages: messages,
  };

  try {
    const signHeaders = genSignHeaders(APP_ID, APP_KEY, METHOD, URI, params);
    const headers = {
      ...signHeaders,
      "Content-Type": "application/json",
    };

    const url = `http://${DOMAIN}${URI}`;

    const queryParams = new URLSearchParams({
      requestId: params.requestId,
    });

    const response = await fetch(`${url}?${queryParams}`, {
      method: METHOD,
      headers,
      body: JSON.stringify(data),
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
