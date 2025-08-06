export interface RecommendedResource {
  id: string;
  title: string;
  type: "article" | "video" | "document" | "link";
  description: string;
  url?: string;
  tags: string[];
  relevanceScore: number;
}
