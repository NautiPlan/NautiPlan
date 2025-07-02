export interface VivoGptRequestData {
  prompt: string;
  model?: string;
}

export interface VivoGptResponse {
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
export interface ImageMessage {
  role: string;
  content: string;
  contentType: string;
}
