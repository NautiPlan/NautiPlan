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

export interface AsrResult {
  ed: number;
  onebest: string;
  bg: number;
}

export interface AsrResponse {
  action: string;
  code: number;
  desc: string;
  sid: string;
  type: string;
  data: {
    result: AsrResult[];
  };
}
