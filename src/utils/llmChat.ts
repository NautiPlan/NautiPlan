import { v4 as uuidv4 } from "uuid";

import type { TaskDescription, Task, Plan } from "../interface/task";
import { useInferenceStore } from "../store/llmStore";
import { TempTask, tempTasksToTasks } from "./chat";

function stripCodeFences(text: string): string {
  return text
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

function extractJsonArray(text: string): string | null {
  const cleaned = stripCodeFences(text);
  const match = cleaned.match(/\[[\s\S]*\]/);
  return match?.[0] ?? null;
}

function coerceTempTasks(value: unknown): TempTask[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const id =
        typeof obj.id === "string" && obj.id.trim() ? obj.id : uuidv4();
      const name = typeof obj.name === "string" ? obj.name : "";
      const dayRaw = obj.day;
      const day =
        typeof dayRaw === "string"
          ? dayRaw
          : typeof dayRaw === "number"
            ? String(dayRaw)
            : "";
      if (!name.trim() || !/^\d+$/.test(day)) return null;
      return { id, name: name.trim(), day } satisfies TempTask;
    })
    .filter((x): x is TempTask => Boolean(x));
}

export async function callOnDevicePlanner(
  taskDescription: TaskDescription
): Promise<Plan | null> {
  try {
    const systemPrompt = `你是一个AI日程管理助手。
请根据用户提供的计划描述，拆解为多个子任务，并把每个子任务安排到第几天（从1开始）。
要求：任务要具体可执行；输出必须严格符合 schema；不要输出任何多余文字。`;

    const schemaHint = `schema:
- 输出必须是 JSON 数组
- 数组元素为对象：{ "id": string, "name": string, "day": string }
- day 必须是从 1 开始的数字字符串，如 "1"、"2"、"3" ...
- 不要输出 markdown，不要输出解释，只输出 JSON`;

    const prompt = `${systemPrompt}\n\n${schemaHint}\n\n用户输入(JSON)：\n${JSON.stringify(
      taskDescription
    )}\n\n只输出 JSON数组：`;

    const { llmChat } = useInferenceStore.getState();
    const raw = await llmChat(prompt);
    const jsonArray = extractJsonArray(raw);
    if (!jsonArray) {
      throw new Error(`端侧模型未返回 JSON 数组。原始输出: ${raw}`);
    }

    const parsed = JSON.parse(jsonArray);
    const tempTasks = coerceTempTasks(parsed);
    if (tempTasks.length === 0) {
      throw new Error(`端侧模型返回内容无法解析为任务数组。原始输出: ${raw}`);
    }

    const tasks: Task[] = tempTasksToTasks(tempTasks, taskDescription);

    const plan: Plan = {
      id: taskDescription.id,
      name: taskDescription.name,
      startDate: taskDescription.startDate,
      dueDate: taskDescription.dueDate,
      priority: taskDescription.importance,
      completed: false,
      Tasks: tasks,
    };
    return plan;
  } catch (err) {
    console.error("callOnDevicePlanner error:", err);
    return null;
  }
}
