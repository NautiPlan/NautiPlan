import { fetch } from "@tauri-apps/plugin-http";
import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import { genSignHeaders } from "./auth";
import { rerankWebSearchResults, webSearch } from "./webSearch";
import { WebSearchRes, RerankedWebSearchRes } from "../interface/resource";

const APP_ID = "2025795358";
const APP_KEY = "ZFiNLwhFLHHIcAVh";
const URI = "/query_rewrite_base";
const DOMAIN = "api-ai.vivo.com.cn";
const METHOD = "POST";

function buildTaskQuery(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "如何提高工作效率和时间管理";
  }

  const taskNames = tasks.map((task) => task.name).join("、");
  return `我今天有以下任务：${taskNames}。请推荐相关的学习资料和提升方法。`;
}

// 使用查询改写API进行查询改写
async function queryRewrite(query: string): Promise<string[]> {
  const params = {};
  const postData = {
    prompts: [
      ["", "", "", "", "", "", query],
      [
        "请将这个查询改写成1-3个不同角度的相关查询，帮助找到更全面的学习资料和提升方法",
      ],
    ],
  };

  try {
    const signHeaders = genSignHeaders(APP_ID, APP_KEY, METHOD, URI, params);
    const headers = {
      ...signHeaders,
      "Content-Type": "application/json",
    };

    const url = `https://${DOMAIN}${URI}`;

    const response = await fetch(url, {
      method: METHOD,
      headers,
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      const resObj = await response.json();

      if (resObj.code === 0 && resObj.result) {
        const rewrittenQueries = resObj.result;

        if (Array.isArray(rewrittenQueries) && rewrittenQueries.length > 0) {
          return rewrittenQueries;
        } else {
          return [query]; // 返回原查询作为fallback
        }
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
    const combinedQuery = rewrittenQueries.map((q) => `(${q})`).join(" OR ");
    console.log("合并后的查询:", combinedQuery);
    // 调用搜索API
    const webSearchRes: WebSearchRes[] = await webSearch(combinedQuery);

    // 排序
    const rerankedResults: RerankedWebSearchRes[] =
      await rerankWebSearchResults(combinedQuery, webSearchRes);

    // 转换
    const recommendedResources = rerankedResults.map((result) => {
      const doc = result.document;
      return {
        id: doc.id,
        title: doc.name,
        url: doc.url,
        relevanceScore: result.relevance_score,
        siteIcon: doc.siteIcon || "",
      };
    });

    return recommendedResources;
  } catch (error) {
    console.error("推荐资源生成失败:", error);
  }
}
