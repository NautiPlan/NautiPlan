import { create } from "zustand";
import { Plan } from "../interface/task";

interface PlanStore {
  Plans: Plan[];

  addPlan: (plan: Plan) => void;
  removePlan: (planId: string) => void;
  updatePlan: (planId: string, updatedPlan: Partial<Plan>) => void;
  getPlanById: (planId: string) => Plan | undefined;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  Plans: [],

  addPlan: (plan) => set((state) => ({ Plans: [...state.Plans, plan] })),

  removePlan: (planId) =>
    set((state) => ({
      Plans: state.Plans.filter((plan) => plan.id !== planId),
    })),

  updatePlan: (planId, updatedPlan) =>
    set((state) => ({
      Plans: state.Plans.map((plan) => (plan.id === planId ? { ...plan, ...updatedPlan } : plan)),
    })),

  getPlanById: (planId) => get().Plans.find((plan) => plan.id === planId),

  getTasksByPlanId: (planId: string) => get().Plans.find((plan) => plan.id === planId)?.Tasks || [],
}));
