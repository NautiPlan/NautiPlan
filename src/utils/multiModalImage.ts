import { invoke } from "@tauri-apps/api/core";
import { FileWithMeta, ImageData } from "../interface/fileWithMeta";

const API_KEY = import.meta.env.VITE_ALIAPI_KEY as string;

const encodeImage = (file: FileWithMeta): ImageData => {
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
  const images: ImageData[] = files.map((file) => encodeImage(file));
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
