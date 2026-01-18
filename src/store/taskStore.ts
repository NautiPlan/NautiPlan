import Database from "@tauri-apps/plugin-sql";
import { create } from "zustand";
import { Plan, Task } from "../interface/task";
import { loadDatabase } from "../utils/database";
import { calculateDynamicPriority, getTasksNeedReschedule } from "../utils/priority";

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
  updateTaskDate: (taskId: string, newDate: Date) => Promise<void>;
  getTasksByDate: (date: Date) => Task[];
  toggleTaskById: (taskId: string) => void;
  getPlanByTaskId: (taskId: string) => Plan | undefined;
  isPlanCompleted: (planId: string) => boolean;
  
  // 动态优先级相关方法
  getDynamicPriority: (planId: string) => number;
  getPlansWithDynamicPriority: () => Array<Plan & { dynamicPriority: number }>;
  getOverdueTasksForPlan: (planId: string) => Array<{
    taskId: string;
    taskName: string;
    originalDate: Date;
    isStrictMode: boolean;
  }>;
}

const createDefaultPlan = (): Plan => {
  const defaultPlanId = "default-plan-001";
  const today = new Date();

  const defaultTaskId = "default-task-001";
  const defaultTask: Task = {
    id: defaultTaskId,
    name: "临时任务1",
    date: today,
    completed: false,
    planId: defaultPlanId,
  };

  return {
    id: defaultPlanId,
    name: "未分类计划",
    startDate: today,
    dueDate: null,
    priority: 5,
    completed: false,
    Tasks: [defaultTask],
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
      const plans: Plan[] = await db.select<Plan[]>("SELECT * FROM Plans");
      if (plans.length === 0) {
        const defaultPlan = createDefaultPlan();

        await Promise.all([await db.execute("INSERT INTO Plans (id, name, startDate, dueDate, priority, completed) VALUES (?, ?, ?, ?, ?, ?)", [defaultPlan.id, defaultPlan.name, defaultPlan.startDate.toISOString(), defaultPlan.dueDate ? defaultPlan.dueDate.toISOString() : null, defaultPlan.priority, defaultPlan.completed]), await db.execute("INSERT INTO Tasks (id, name, date, completed, planId) VALUES (?, ?, ?, ?, ?)", [defaultPlan.Tasks[0].id, defaultPlan.Tasks[0].name, defaultPlan.Tasks[0].date.toISOString(), defaultPlan.Tasks[0].completed, defaultPlan.id])]);

        set({ Plans: [defaultPlan], defaultPlanId: defaultPlan.id, db: db });
      } else {
        const plansWithTasks = await Promise.all(
          plans.map(async (rawPlan) => {
            // 格式化plan数据类型
            const formattedPlan: Plan = {
              id: rawPlan.id,
              name: rawPlan.name,
              startDate: new Date(rawPlan.startDate),
              dueDate: rawPlan.dueDate ? new Date(rawPlan.dueDate) : null,
              priority: Number(rawPlan.priority),
              completed: JSON.parse(rawPlan.completed as unknown as string),
              Tasks: [],
            };

            // 查询并格式化tasks
            const rawTasks: Task[] = await db.select<any[]>("SELECT * FROM Tasks WHERE planId = ?", [rawPlan.id]);
            const formattedTasks: Task[] = rawTasks.map((rawTask) => ({
              id: rawTask.id,
              name: rawTask.name,
              date: rawTask.date ? new Date(rawTask.date) : new Date(),
              completed: JSON.parse(rawTask.completed as unknown as string),
              planId: rawTask.planId,
            }));

            // 按日期升序排序任务（早的日期在前）
            formattedTasks.sort((a, b) => {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return dateA - dateB;
            });

            formattedPlan.Tasks = formattedTasks;
            return formattedPlan;
          })
        );
        set({ Plans: plansWithTasks, defaultPlanId: "default-plan-001", db: db });
      }
    },

    addPlan: async (plan) => {
      const db = get().db;
      await db?.execute("INSERT INTO Plans (id, name, startDate, dueDate, priority, completed) VALUES (?, ?, ?, ?, ?, ?)", [plan.id, plan.name, plan.startDate.toISOString(), plan.dueDate!.toISOString(), plan.priority, plan.completed]);
      if (plan.Tasks) {
        await Promise.all(plan.Tasks.map((task) => db?.execute("INSERT INTO Tasks (id, name, date, completed, planId) VALUES (?, ?, ?, ?, ?)", [task.id, task.name, task.date.toISOString(), task.completed, plan.id])));
      }
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

      const targetPlan = get().getPlanByTaskId(taskId);
      if (!targetPlan) return;

      const prePlanCompleted = targetPlan.completed;

      set((state) => ({
        Plans: state.Plans.map((plan) => {
          if (plan.id === targetPlan.id) {
            const updatedTasks = plan.Tasks?.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task));

            const planCompleted = updatedTasks && updatedTasks.length > 0 ? updatedTasks.every((task) => task.completed) : true;

            return {
              ...plan,
              Tasks: updatedTasks,
              completed: planCompleted,
            };
          }
          return plan;
        }),
      }));

      const updatedPlan = get().getPlanById(targetPlan.id);
      if (updatedPlan && prePlanCompleted !== updatedPlan.completed) {
        await db?.execute("UPDATE Plans SET completed = ? WHERE id = ?", [updatedPlan.completed, targetPlan.id]);
      }
    },

    removeTaskById: async (taskId) => {
      const db = get().db;

      const targetPlan = get().getPlanByTaskId(taskId);
      if (!targetPlan) return;

      await db?.execute("DELETE FROM Tasks WHERE id = ?", [taskId]);
      set((state) => ({
        Plans: state.Plans.map((plan) => {
          if (plan.id === targetPlan.id) {
            const updatedTasks = plan.Tasks?.filter((task) => task.id !== taskId);

            const planCompleted = updatedTasks && updatedTasks.length > 0 ? updatedTasks.every((task) => task.completed) : true;

            return {
              ...plan,
              Tasks: updatedTasks,
              completed: planCompleted,
            };
          }
          return {
            ...plan,
            Tasks: plan.Tasks?.filter((task) => task.id !== taskId),
          };
        }),
      }));

      const updatedPlan = get().getPlanById(targetPlan.id);
      if (targetPlan.completed === false) {
        await db?.execute("UPDATE Plans SET completed = ? WHERE id = ?", [updatedPlan?.completed, targetPlan.id]);
      }
    },

    isDefaultPlan: (planId) => planId === get().defaultPlanId,

    addTaskToPlan: async (planId, task) => {
      const db = get().db;
      await db?.execute("INSERT INTO Tasks (id, name, date, completed, planId) VALUES (?, ?, ?, ?, ?)", [task.id, task.name, task.date.toISOString(), task.completed, planId]);

      set((state) => {
        const plan = state.Plans.find((p) => p.id === planId);
        if (!plan) return state;

        return {
          Plans: state.Plans.map((p) => {
            if (p.id === planId) {
              const updatedTasks = [...(p.Tasks || []), task];
              
              // 按日期升序排序任务（早的日期在前）
              updatedTasks.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
              });
              
              return {
                ...p,
                Tasks: updatedTasks,
                completed: task.completed ? p.completed : false,
              };
            }
            return p;
          }),
        };
      });

      const plan = get().getPlanById(planId);

      if (task.completed === false && plan?.completed === true) {
        const updatedPlan = get().getPlanById(planId);
        if (updatedPlan) {
          await db?.execute("UPDATE Plans SET completed = ? WHERE id = ?", [false, planId]);
        }
      }
    },

    updateTaskDate: async (taskId, newDate) => {
      const db = get().db;
      
      // 更新数据库
      await db?.execute(
        "UPDATE Tasks SET date = ? WHERE id = ?",
        [newDate.toISOString(), taskId]
      );

      // 更新内存状态并重新排序任务
      set((state) => ({
        Plans: state.Plans.map((plan) => {
          const updatedTasks = plan.Tasks?.map((task) =>
            task.id === taskId ? { ...task, date: newDate } : task
          );
          
          // 按日期升序排序任务（早的日期在前）
          const sortedTasks = updatedTasks?.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateA - dateB;
          });
          
          return {
            ...plan,
            Tasks: sortedTasks,
          };
        }),
      }));
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

    isPlanCompleted: (planId) => {
      const plan = get().getPlanById(planId);
      if (!plan) return false;
      if (!plan.Tasks || plan.Tasks.length === 0) {
        return true;
      }
      return plan.Tasks?.every((task) => task.completed);
    },

    // 获取动态优先级
    getDynamicPriority: (planId) => {
      const plan = get().getPlanById(planId);
      if (!plan) return 0;
      
      // 默认计划（未分类计划）使用固定低优先级
      if (get().isDefaultPlan(planId)) {
        return 0;
      }
      
      return calculateDynamicPriority(plan);
    },

    // 获取带动态优先级的计划列表（用于排序显示）
    getPlansWithDynamicPriority: () => {
      const plans = get().Plans;
      const defaultPlanId = get().defaultPlanId;
      
      return plans.map(plan => {
        const dynamicPriority = plan.id === defaultPlanId 
          ? 0  // 默认计划固定为0
          : calculateDynamicPriority(plan);
        
        return {
          ...plan,
          dynamicPriority
        };
      });
    },

    // 获取计划中需要重新安排的超时任务
    getOverdueTasksForPlan: (planId) => {
      const plan = get().getPlanById(planId);
      if (!plan) return [];
      
      // 默认计划不需要重新安排任务
      if (get().isDefaultPlan(planId)) {
        return [];
      }
      
      return getTasksNeedReschedule(plan);
    },
  };
});
