import { invoke } from "@tauri-apps/api/core";

async function initModel() {
  try {
    const result = await invoke("init_bluelm");
    console.log("初始化结果:", result);
    return result;
  } catch (error) {
    console.error("初始化失败:", error);
    throw error;
  }
}

async function generateContent(prompt: string) {
  try {
    const result = await invoke("use_bluelm", { prompt });
    console.log("生成的内容:", result);
    return result;
  } catch (error) {
    console.error("生成内容失败:", error);
    throw error;
  }
}

async function releaseModel() {
  try {
    const result = await invoke("release_bluelm");
    console.log("释放结果:", result);
    return result;
  } catch (error) {
    console.error("释放失败:", error);
    throw error;
  }
}

export async function callVivoEdgeGpt(prompt: string): Promise<string | null> {
  try {
    // 确保模型已初始化
    await initModel();

    // 生成内容
    const result = await generateContent(prompt);
    console.log("生成的内容:", result);

    await releaseModel();
    return result as string;
  } catch (error) {
    console.error("调用 VivoEdgeGpt 失败:", error);
    return null;
  }
}
