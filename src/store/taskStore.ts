import Database from "@tauri-apps/plugin-sql";
import { create } from "zustand";
import { Plan, Task } from "../interface/task";
import { loadDatabase } from "../utils/database";

interface PlanStore {
  Plans: Plan[];
  defaultPlanId: string;
  db: Database | null;

  // 数据库同步方法
  syncToDatabase: () => Promise<void>;

  addPlan: (plan: Plan) => void;
  removePlan: (planId: string) => void;
  getPlanById: (planId: string) => Plan | undefined;
  getPlanByStartDate: (date: Date) => Plan[];
  getPlanByDueDate: (date: Date) => Plan[];
  getPlanByDate: (date: Date) => Plan[];
  isDefaultPlan: (planId: string) => boolean;
  getTaskById: (taskId: string) => Task | undefined;
  removeTaskById: (taskId: string) => void;
  addTaskToPlan: (planId: string, task: Task) => void;
  getTasksByDate: (date: Date) => Task[];
  toggleTaskById: (taskId: string) => void;
  getPlanByTaskId: (taskId: string) => Plan | undefined;
}

const createDefaultPlan = (): Plan => {
  const defaultPlanId = "default-plan-001";
  const today = new Date();

  return {
    id: defaultPlanId,
    name: "默认计划",
    startDate: today,
    dueDate: null,
    priority: 5,
    completed: false,
    Tasks: [],
  };
};

export const usePlanStore = create<PlanStore>((set, get) => {
  return {
    Plans: [],
    defaultPlanId: "",
    db: null,

    syncToDatabase: async () => {
      const db = await loadDatabase();
      // 查找Plan是否为空表
      const plans = await db.select<Plan[]>("SELECT * FROM Plans");
      if (plans.length === 0) {
        const defaultPlan = createDefaultPlan();
        await db.execute("INSERT INTO Plans (id, name, startDate, dueDate, priority, completed) VALUES (?, ?, ?, ?, ?, ?)", [defaultPlan.id, defaultPlan.name, defaultPlan.startDate.toISOString(), defaultPlan.dueDate ? defaultPlan.dueDate.toISOString() : null, defaultPlan.priority, defaultPlan.completed]);
        set({ Plans: [defaultPlan], defaultPlanId: defaultPlan.id, db: db });
      } else {
        const plansWithTasks = await Promise.all(
          plans.map(async (plan) => {
            const tasks = await db.select<Task[]>("SELECT * FROM Tasks WHERE planId = ?", [plan.id]);
            return { ...plan, Tasks: tasks };
          })
        );
        set({ Plans: plansWithTasks, defaultPlanId: "default-plan-001", db: db });
      }
    },

    addPlan: async (plan) => {
      const db = get().db;
      await db?.execute("INSERT INTO Plans (id, name, startDate, dueDate, priority, completed) VALUES (?, ?, ?, ?, ?, ?)", [plan.id, plan.name, plan.startDate.toISOString(), plan.dueDate ? plan.dueDate.toISOString() : null, plan.priority, plan.completed]);
      set((state) => ({ Plans: [...state.Plans, plan] }));
    },

    removePlan: async (planId) => {
      const db = get().db;
      if (planId !== get().defaultPlanId) {
        await db?.execute("DELETE FROM Plans WHERE id = ?", [planId]);
        await db?.execute("DELETE FROM Tasks WHERE planId = ?", [planId]);
      }
      set((state) => {
        if (planId === state.defaultPlanId) {
          return state;
        }
        return {
          Plans: state.Plans.filter((plan) => plan.id !== planId),
        };
      });
    },

    getPlanById: (planId) => get().Plans.find((plan) => plan.id === planId),

    getTasksByDate: (date: Date) => get().Plans.flatMap((plan) => plan.Tasks?.filter((task) => new Date(task.date).toDateString() === date.toDateString()) || []),

    toggleTaskById: async (taskId) => {
      const db = get().db;
      await db?.execute("UPDATE Tasks SET completed = NOT completed WHERE id = ?", [taskId]);
      set((state) => ({
        Plans: state.Plans.map((plan) => ({
          ...plan,
          Tasks: plan.Tasks?.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
        })),
      }));
    },

    removeTaskById: async (taskId) => {
      const db = get().db;
      await db?.execute("DELETE FROM Tasks WHERE id = ?", [taskId]);
      set((state) => ({
        Plans: state.Plans.map((plan) => ({
          ...plan,
          Tasks: plan.Tasks?.filter((task) => task.id !== taskId),
        })),
      }));
    },

    isDefaultPlan: (planId) => planId === get().defaultPlanId,

    addTaskToPlan: async (planId, task) => {
      const db = get().db;
      await db?.execute("INSERT INTO Tasks (id, name, date, completed, planId) VALUES (?, ?, ?, ?, ?)", [task.id, task.name, task.date.toISOString(), task.completed, planId]);
      set((state) => {
        const plan = state.Plans.find((p) => p.id === planId);
        if (!plan) return state;

        return {
          Plans: state.Plans.map((p) => (p.id === planId ? { ...p, Tasks: [...(p.Tasks || []), task] } : p)),
        };
      });
    },

    getTaskById: (taskId) => {
      const plans = get().Plans;
      for (const plan of plans) {
        const task = plan.Tasks?.find((t) => t.id === taskId);
        if (task) {
          return task;
        }
      }
      return undefined;
    },

    getPlanByStartDate: (date: Date) => get().Plans.filter((plan) => plan.startDate && new Date(plan.startDate).toDateString() === date.toDateString()),

    getPlanByDueDate: (date: Date) => get().Plans.filter((plan) => plan.dueDate && new Date(plan.dueDate).toDateString() === date.toDateString()),

    getPlanByDate: (date: Date) =>
      get().Plans.filter((plan) => {
        const start = plan.startDate ? new Date(plan.startDate) : undefined;
        const end = plan.dueDate ? new Date(plan.dueDate) : undefined;
        const d = new Date(date);

        // 只要date在[startDate, dueDate]区间内（含端点），就返回
        if (start && end) {
          return d >= start && d <= end;
        }
        if (start && !end) {
          return d >= start;
        }
        if (!start && end) {
          return d <= end;
        }
        return false;
      }),

    getPlanByTaskId: (taskId) => {
      const plans = get().Plans;
      for (const plan of plans) {
        if (plan.Tasks?.some((task) => task.id === taskId)) {
          return plan;
        }
      }
      return undefined;
    },
  };
});
