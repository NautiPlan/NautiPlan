export interface RecommendedResource {
  id: string;
  title: string;
  url: string;
  relevanceScore: number;
  siteIcon: string;
}

export interface WebSearchRes {
  id: string;
  name: string;
  url: string;
  snippet: string;
  summary: string;
  siteIcon: string;
}

export interface RerankedWebSearchRes {
  index: number;
  document: WebSearchRes;
  relevanceScore: number;
}
