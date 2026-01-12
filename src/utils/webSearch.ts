import { fetch } from "@tauri-apps/plugin-http";
import { WebSearchRes, RerankedWebSearchRes } from "../interface/resource";

const webApiKey: string = import.meta.env.VITE_WebAPI_KEY;
const domain = "https://api.bochaai.com";
const WebSearchURL = "/v1/web-search";
const RankerURL = "/v1/rerank";

export async function webSearch(query: string): Promise<WebSearchRes[]> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${webApiKey}`,
  };
  const body = JSON.stringify({
    query,
    freshness: "nolimit",
    summary: true,
    include: "bilibili.com|github.com",
    count: 50,
  });

  const response = await fetch(`${domain}${WebSearchURL}`, {
    method: "POST",
    headers,
    body,
  });

  if (response.ok) {
    const data = await response.json();
    if (data.code === 200 && data.data) {
      return data.data.webPages.value.map((item: any) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        snippet: item.snippet,
        summary: item.summary,
        siteIcon: item.siteIcon || "",
      }));
    } else {
      console.error("WebSearch API error:", JSON.stringify(data));
      return [];
    }
  } else {
    console.error("WebSearch request failed:", response.statusText);
    return [];
  }
}

export async function rerankWebSearchResults(
  query: string,
  documents: WebSearchRes[]
): Promise<RerankedWebSearchRes[]> {
  if (!documents || documents.length === 0) {
    return [];
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${webApiKey}`,
  };

  const documentsAsText = documents.map(
    (doc) => `${doc.name}. ${doc.summary || doc.snippet}`
  );

  const body = JSON.stringify({
    model: "gte-rerank",
    query,
    documents: documentsAsText,
    top_n: 3,
    return_documents: true,
  });
  try {
    const response = await fetch(`${domain}${RankerURL}`, {
      method: "POST",
      headers,
      body,
    });

    if (response.ok) {
      const data = await response.json();

      if (data.code === 200 && data.data?.results) {
        const rerankedResults: RerankedWebSearchRes[] = data.data.results.map(
          (result: { index: number; relevance_score: number }) => {
            return {
              index: result.index,
              document: documents[result.index],
              relevance_score: result.relevance_score,
            };
          }
        );

        return rerankedResults;
      } else {
        console.error("Rerank API 业务错误:", JSON.stringify(data, null, 2));
        return [];
      }
    } else {
      const errorBody = await response.text();
      console.error(
        `Rerank HTTP 请求失败，状态码 ${response.status}:`,
        errorBody
      );
      return [];
    }
  } catch (error) {
    console.error("rerankWebSearchResults 函数执行失败:", error);
    return [];
  }
}
