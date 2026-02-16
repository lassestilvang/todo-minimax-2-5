export type Priority = "HIGH" | "MEDIUM" | "LOW" | "NONE";
export type RecurringType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
export type ViewType = "today" | "week" | "upcoming" | "all";

export interface List {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: Date | null;
  deadline: Date | null;
  reminder: Date | null;
  estimate: number | null;
  actualTime: number | null;
  priority: Priority;
  recurringType: RecurringType | null;
  recurringCustom: string | null;
  attachmentUrl: string | null;
  listId: string | null;
  createdAt: Date;
  updatedAt: Date;
  labels?: Label[];
  subtasks?: Subtask[];
  taskLogs?: TaskLog[];
}

export interface Label {
  id: string;
  name: string;
  emoji: string | null;
  color: string | null;
  createdAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  taskId: string;
  createdAt: Date;
}

export interface TaskLog {
  id: string;
  action: string;
  details: string | null;
  taskId: string;
  createdAt: Date;
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: Date;
  deadline?: Date;
  reminder?: Date;
  estimate?: number;
  priority: Priority;
  recurringType?: RecurringType;
  recurringCustom?: string;
  listId?: string;
  labelIds?: string[];
}

export interface ListFormData {
  name: string;
  emoji?: string;
  color?: string;
}

export interface LabelFormData {
  name: string;
  emoji?: string;
  color?: string;
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
  NONE: "#6b7280",
};

export const LIST_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
];
