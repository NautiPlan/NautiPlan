import { Plan, Task, TaskDescription } from "../interface/task";
import { invoke } from "@tauri-apps/api/core";

export interface TempTask {
  id: string;
  name: string;
  day: string;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function tempTasksToTasks(
  tempTasks: TempTask[],
  taskDescription: TaskDescription
): Task[] {
  const base = new Date(taskDescription.startDate);
  base.setHours(0, 0, 0, 0);

  const planId = taskDescription.id;

  return tempTasks.map((t) => {
    const dayIndex = Number(t.day);
    const date = addDays(base, dayIndex - 1);

    const task: Task = {
      id: t.id,
      name: t.name,
      date,
      completed: false,
      planId,
    };

    return task;
  });
}

export async function callGpt(
  taskDescription: TaskDescription
): Promise<Plan | null> {
  try {
    const response = await invoke<string>("aliyun_gpt", {
      prompt: JSON.stringify(taskDescription),
    });
    console.log("aliyun_gpt 调用成功:", response);
    // 这里的response是一个JSON字符串，形式为TempTask[]，时间为1,2,3
    const tempTasks: TempTask[] = JSON.parse(response ?? "[]");
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
  } catch (error) {
    console.error("aliyun_gpt 调用失败:", error);
    return null;
  }
}
