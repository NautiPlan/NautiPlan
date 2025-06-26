export interface TaskDescription {
  id: string;
  name: string;
  startDate: Date;
  dueDate: Date;
  taskDescription: string | undefined;
  importance: number;
}

export interface Task {
  id: string;
  name: string;
  date: Date;
  completed: boolean;
}

export interface Plan {
  id: string;
  name: string;
  startDate: Date;
  dueDate: Date | null;
  priority: number;
  completed: boolean;
  Tasks: Task[];
}
