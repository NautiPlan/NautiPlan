export interface TaskSummary {
  taskId: string;
  title: string;
  status: "completed" | "in-progress" | "pending";
  completionRate: number;
  timeSpent: number;
  category: string;
}

export interface MonthlyReportData {
  id: string;
  month: string;
  userId: string;
  createdAt: Date;

  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalTimeSpent: number;

  tasks: TaskSummary[];

  summary: string;
  achievements: string[];
  challenges: string[];
  recommendations: string[];
}

export interface ReportRequestData {
  month: string;
  tasks: TaskSummary[];
  userGoals?: string;
}
