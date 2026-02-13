export interface List {
  id: string;
  name: string;
  emoji?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: Date | null;
  listId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskWithList = Task & {
  list?: List | null;
};

export type ListWithTasks = List & {
  tasks: Task[];
};
