import { create } from "zustand";
import { Plan, Task } from "../interface/task";

interface PlanStore {
  Plans: Plan[];
  defaultPlanId: string;

  addPlan: (plan: Plan) => void;
  removePlan: (planId: string) => void;
  updatePlan: (planId: string, updatedPlan: Partial<Plan>) => void;
  getPlanById: (planId: string) => Plan | undefined;
  getTasksByDate: (date: Date) => Task[];
  toggleTaskById: (taskId: string) => void;
  removeTaskById: (taskId: string) => void;
  isDefaultPlan: (planId: string) => boolean;
  addTaskToPlan: (planId: string, task: Task) => void;
}

// 创建默认计划
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
  const defaultPlan = createDefaultPlan();
  return {
    Plans: [defaultPlan],
    defaultPlanId: defaultPlan.id,

    addPlan: (plan) => set((state) => ({ Plans: [...state.Plans, plan] })),

    removePlan: (planId) =>
      set((state) => {
        if (planId === state.defaultPlanId) {
          return state;
        }
        return {
          Plans: state.Plans.filter((plan) => plan.id !== planId),
        };
      }),

    updatePlan: (planId, updatedPlan) =>
      set((state) => {
        if (planId === state.defaultPlanId) {
          return state;
        }
        return {
          Plans: state.Plans.map((plan) => (plan.id === planId ? { ...plan, ...updatedPlan } : plan)),
        };
      }),

    getPlanById: (planId) => get().Plans.find((plan) => plan.id === planId),

    getTasksByDate: (date: Date) => get().Plans.flatMap((plan) => plan.Tasks?.filter((task) => new Date(task.date).toDateString() === date.toDateString()) || []),

    toggleTaskById: (taskId) =>
      set((state) => ({
        Plans: state.Plans.map((plan) => ({
          ...plan,
          Tasks: plan.Tasks?.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
        })),
      })),

    removeTaskById: (taskId) =>
      set((state) => ({
        Plans: state.Plans.map((plan) => ({
          ...plan,
          Tasks: plan.Tasks?.filter((task) => task.id !== taskId),
        })),
      })),

    isDefaultPlan: (planId) => planId === get().defaultPlanId,

    addTaskToPlan: (planId, task) =>
      set((state) => {
        const plan = state.Plans.find((p) => p.id === planId);
        if (!plan) return state;

        return {
          Plans: state.Plans.map((p) => (p.id === planId ? { ...p, Tasks: [...(p.Tasks || []), task] } : p)),
        };
      }),
  };
});
