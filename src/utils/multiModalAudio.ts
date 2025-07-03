import { fetch } from "@tauri-apps/plugin-http";
import { v4 as uuidv4 } from "uuid";
import { AsrResponse, AsrResult } from "../interface/chat";
import FileWithMeta from "../interface/fileWithMeta";
import { genSignHeaders } from "./auth";

// const headers = { "Content-Type": "application/json" };

const SLICE_LEN = 5 * 1024 * 1024;

const domain = "api-ai.vivo.com.cn/lasr";

const appid = "2025795358";
const appkey = "ZFiNLwhFLHHIcAVh";

const AUDIO_API_URL = "http://" + domain;

const audio_type = "auto";
// const audio_type = "pcm";

function createParams(interfacePath: string, audio_id?: string, x_session_id?: string, slice_index?: number): { param_str: string; headers: Record<string, string> } {
  const t = Date.now();

  const params: Record<string, string> = {
    client_version: encodeURIComponent("2.0"),
    package: encodeURIComponent("pack"),
    user_id: encodeURIComponent("2addc42b7ae689dfdf1c63e220df52a2"),
    system_time: encodeURIComponent(t.toString()),
    net_type: "1",
    engineid: "fileasrrecorder",
  };

  if (interfacePath === "/lasr/upload") {
    params["audio_id"] = audio_id!;
    params["x-sessionId"] = x_session_id!;
    params["slice_index"] = slice_index!.toString();
  }

  const signHeaders = genSignHeaders(appid, appkey, "POST", interfacePath, params);

  let param_str = "";
  let seq = "";

  for (const [key, value] of Object.entries(params)) {
    param_str = param_str + seq + key + "=" + value;
    seq = "&";
  }

  return { param_str, headers: signHeaders as unknown as Record<string, string> };
}

async function httpChunkUpload(audio_data: ArrayBuffer, audio_id: string, x_session_id: string, slice_index: number): Promise<Response> {
  try {
    const boundary = uuidv4().replace(/-/g, "");

    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    parts.push(encoder.encode("------------------------------" + boundary + "\r\n"));
    parts.push(encoder.encode('Content-Disposition: form-data; name="file"; filename="test.wav"\r\n'));
    parts.push(encoder.encode("Content-Type: application/octet-stream\r\n\r\n"));
    parts.push(new Uint8Array(audio_data));
    parts.push(encoder.encode("\r\n"));
    parts.push(encoder.encode("------------------------------" + boundary + "--\r\n"));

    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const reqbody = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      reqbody.set(part, offset);
      offset += part.length;
    }

    const { param_str, headers } = createParams("/lasr/upload", audio_id, x_session_id, slice_index);
    headers["Accept"] = "*/*";
    headers["Content-Type"] = "multipart/form-data; boundary=----------------------------" + boundary;

    const requrl = AUDIO_API_URL + "/upload?" + param_str;
    const resp = await fetch(requrl, {
      method: "POST",
      body: reqbody,
      headers: headers,
    });

    return resp;
  } catch (e) {
    throw new Error(`Upload failed: ${e}`);
  }
}

async function taskCreate(audio_buffer: ArrayBuffer, x_session_id: string, audio_type: string): Promise<{ err: number; audio_id: string; slice_num: number }> {
  const size = audio_buffer.byteLength;

  const slice_num = Math.ceil(size / SLICE_LEN);

  const post_body = {
    audio_type: audio_type,
    "x-sessionId": x_session_id,
    slice_num: slice_num,
  };

  const { param_str, headers } = createParams("/lasr/create");
  headers["Content-Type"] = "application/json; charset=UTF-8";

  const requrl = AUDIO_API_URL + "/create?" + param_str;

  try {
    const resp = await fetch(requrl, {
      method: "POST",
      body: JSON.stringify(post_body),
      headers: headers,
    });

    const result = await resp.json();

    if (resp.status === 200) {
      if (result) {
        const errno = result["action"];
        if (errno === "error") {
          return { err: 1, audio_id: result["desc"], slice_num };
        } else {
          return { err: 0, audio_id: result["data"]["audio_id"], slice_num };
        }
      } else {
        return { err: 1, audio_id: await resp.text(), slice_num };
      }
    } else {
      return { err: resp.status, audio_id: await resp.text(), slice_num };
    }
  } catch (e) {
    console.error("task_create err", e);
    return { err: 1, audio_id: String(e), slice_num };
  }
}

async function taskUpload(audio_id: string, audio_buffer: ArrayBuffer, n_slices: number, x_session_id: string): Promise<void> {
  let slice_index = 0;

  while (slice_index < n_slices) {
    const start = slice_index * SLICE_LEN;
    const end = Math.min(start + SLICE_LEN, audio_buffer.byteLength);
    const slice_data = audio_buffer.slice(start, end);

    try {
      const resp = await httpChunkUpload(slice_data, audio_id, x_session_id, slice_index);

      if (resp.status === 200) {
        const json = await resp.json();
        if (json) {
          const errno = json["action"];
          if (errno === "error") {
            console.error("[ERR] status:", 1, "message:", json["desc"]);
            break;
          } else {
            slice_index++;
          }
        } else {
          console.error("[ERR] status:", 1, "message:", await resp.text());
          break;
        }
      } else {
        console.error("[ERR] status:", resp.status, "message:", await resp.text());
        break;
      }
    } catch (e) {
      console.error("[ERR] upload error:", e);
      break;
    }
  }
}

async function taskRun(x_session_id: string, audio_id: string): Promise<any> {
  const post_body = {
    audio_id: audio_id,
    "x-sessionId": x_session_id,
  };

  const { param_str, headers } = createParams("/lasr/run");
  headers["Content-Type"] = "application/json; charset=UTF-8";
  const requrl = AUDIO_API_URL + "/run?" + param_str;

  const resp = await fetch(requrl, {
    method: "POST",
    body: JSON.stringify(post_body),
    headers: headers,
  });

  const result = await resp.json();
  return result;
}

async function taskProgress(x_session_id: string, task_id: string): Promise<any> {
  const post_body = {
    task_id: task_id,
    "x-sessionId": x_session_id,
  };

  const { param_str, headers } = createParams("/lasr/progress");
  headers["Content-Type"] = "application/json; charset=UTF-8";
  const requrl = AUDIO_API_URL + "/progress?" + param_str;

  const resp = await fetch(requrl, {
    method: "POST",
    body: JSON.stringify(post_body),
    headers: headers,
  });

  const result = await resp.json();
  return result;
}

async function taskResult(x_session_id: string, task_id: string): Promise<string> {
  const post_body = {
    task_id: task_id,
    "x-sessionId": x_session_id,
  };

  const { param_str, headers } = createParams("/lasr/result");
  headers["Content-Type"] = "application/json; charset=UTF-8";
  const requrl = AUDIO_API_URL + "/result?" + param_str;

  const resp = await fetch(requrl, {
    method: "POST",
    body: JSON.stringify(post_body),
    headers: headers,
  });

  const result = await resp.json();
  return JSON.stringify(result, null, 2);
}

async function processResult(jsonString: string): Promise<string> {
  try {
    const asrResponse: AsrResponse = JSON.parse(jsonString);

    if (!asrResponse.data || !asrResponse.data.result || !Array.isArray(asrResponse.data.result)) {
      console.error("Invalid ASR response format");
      return "";
    }

    return asrResponse.data.result
      .map((item: AsrResult) => item.onebest.trim())
      .filter((text) => text.length > 0)
      .join("");
  } catch (e) {
    console.error("Error parsing result:", e);
    return "";
  }
}

export async function callVivoAudioGpt(files: FileWithMeta[]): Promise<string | null> {
  if (!files || files.length === 0) {
    console.error("No files provided");
    return null;
  }

  const file = files[0];

  try {
    const audio_buffer = file.buffer;

    const x_session_id = uuidv4().replace(/-/g, "");
    const { err, audio_id, slice_num } = await taskCreate(audio_buffer, x_session_id, audio_type);
    if (err) {
      console.error("[ERR] task_create audio status:", err, "message:", audio_id);
      return null;
    }

    await taskUpload(audio_id, audio_buffer, slice_num, x_session_id);

    const task_run_result = await taskRun(x_session_id, audio_id);
    const task_id = task_run_result["data"]["task_id"];

    let progress = 0;
    while (progress !== 100) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const progress_result = await taskProgress(x_session_id, task_id);
      progress = progress_result["data"]["progress"];
    }

    const task_result_result = await taskResult(x_session_id, task_id);

    return processResult(task_result_result);
  } catch (e) {
    console.error("Error:", e);
    return null;
  }
}
