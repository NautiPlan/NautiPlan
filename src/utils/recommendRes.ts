import { Task } from "../interface/task";
import { usePlanStore } from "../store/taskStore";
import { rerankWebSearchResults, webSearch } from "./webSearch";
import { WebSearchRes, RerankedWebSearchRes } from "../interface/resource";
import { useInferenceStore } from "../store/llmStore";

function buildTaskQuery(tasks: Task[]): string {
  if (tasks.length === 0) {
    return "如何提高工作效率和时间管理";
  }

  const taskNames = tasks.map((task) => task.name).join("、");
  return `我今天有以下任务：${taskNames}。请推荐相关的学习资料和提升方法。`;
}

export async function llmSuggestion(date: Date): Promise<string | null> {
  try {
    const getTasksByDate = usePlanStore.getState().getTasksByDate;
    const tasks = getTasksByDate(date);

    const originalQuery =
      "用一两句简单的话，不含任何复杂markdowm语法描述：" +
      buildTaskQuery(tasks);
    const { llmChat } = useInferenceStore.getState();
    let suggestion = await llmChat(originalQuery);
    if (typeof suggestion === "string") {
      suggestion = suggestion.replace(/<eop>/gi, "").trim();
    }
    return suggestion;
  } catch (err) {
    console.error("llmSuggestion error:", err);
    return null;
  }
}

export async function recommendResources(date: Date) {
  try {
    const getTasksByDate = usePlanStore.getState().getTasksByDate;
    const tasks = getTasksByDate(date);

    const originalQuery = buildTaskQuery(tasks);

    // 调用搜索API
    const webSearchRes: WebSearchRes[] = await webSearch(originalQuery);

    // 排序
    const rerankedResults: RerankedWebSearchRes[] =
      await rerankWebSearchResults(originalQuery, webSearchRes);

    console.log(rerankedResults);

    // 转换
    const recommendedResources = rerankedResults.map((result) => {
      const doc = result.document;
      return {
        id: doc.id,
        title: doc.name,
        url: doc.url,
        relevanceScore: result.relevanceScore,
        siteIcon: doc.siteIcon || "",
      };
    });

    return recommendedResources;
  } catch (error) {
    console.error("推荐资源生成失败:", error);
  }
}
