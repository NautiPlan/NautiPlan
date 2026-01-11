import { invoke } from "@tauri-apps/api/core";
import { FileWithMeta, FileData } from "../interface/fileWithMeta";

const API_KEY = import.meta.env.VITE_ALIAPI_KEY as string;

const encodeFile = (file: FileWithMeta): FileData => {
  const data = file.type;

  try {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(file.buffer)));
    return { data, base64 };
  } catch (error) {
    if (error instanceof RangeError) {
      throw new Error("文件过大，无法转换为Base64，请选择更小的文件");
    }
    throw error;
  }
};

export async function callImageGpt(
  files: FileWithMeta[]
): Promise<string | null> {
  const images: FileData[] = files.map((file) => encodeFile(file));
  try {
    const response = await invoke<string>("aliyun_image", {
      images,
      apiKey: API_KEY,
    });
    console.log("aliyun_image 调用成功:", response);
    return response ?? null;
  } catch (error) {
    console.error("aliyun_image 调用失败:", error);
    return null;
  }
}

export async function callAudioGpt(
  files: FileWithMeta[]
): Promise<string | null> {
  const audios: FileData[] = files.map((file) => encodeFile(file));
  try {
    const response = await invoke<string>("aliyun_audio", {
      audios,
      apiKey: API_KEY,
    });
    console.log("aliyun_audio 调用成功:", response);
    return response ?? null;
  } catch (error) {
    console.error("aliyun_audio 调用失败:", error);
    return null;
  }
}
