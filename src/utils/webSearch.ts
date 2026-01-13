import { invoke } from "@tauri-apps/api/core";
import { WebSearchRes, RerankedWebSearchRes } from "../interface/resource";

export async function webSearch(query: string): Promise<WebSearchRes[]> {
  return await invoke<WebSearchRes[]>("web_search", { query });
}

export async function rerankWebSearchResults(
  query: string,
  documents: WebSearchRes[]
): Promise<RerankedWebSearchRes[]> {
  return await invoke<RerankedWebSearchRes[]>("rerank_web_search_results", {
    query,
    documents,
  });
}
