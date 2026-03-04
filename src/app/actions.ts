"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ListFormData, LabelFormData, TaskFormData } from "@/types";

// List Actions
export async function createList(data: ListFormData) {
  const list = await prisma.list.create({
    data: {
      name: data.name,
      emoji: data.emoji || null,
      color: data.color || null,
      isDefault: false,
    },
  });
  revalidatePath("/");
  return list;
}

export async function updateList(id: string, data: ListFormData) {
  const list = await prisma.list.update({
    where: { id },
    data: {
      name: data.name,
      emoji: data.emoji || null,
      color: data.color || null,
    },
  });
  revalidatePath("/");
  return list;
}

export async function deleteList(id: string) {
  // Don't allow deleting the default inbox
  const list = await prisma.list.findUnique({ where: { id } });
  if (list?.isDefault) {
    throw new Error("Cannot delete the default inbox");
  }
  
  // Move tasks to no list
  await prisma.task.updateMany({
    where: { listId: id },
    data: { listId: null },
  });
  
  await prisma.list.delete({ where: { id } });
  revalidatePath("/");
}

export async function getLists() {
  const lists = await prisma.list.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return lists;
}

export async function getOrCreateInbox() {
  let inbox = await prisma.list.findFirst({ where: { isDefault: true } });
  if (!inbox) {
    inbox = await prisma.list.create({
      data: {
        name: "Inbox",
        emoji: "📥",
        isDefault: true,
        color: "#6b7280",
      },
    });
  }
  return inbox;
}

// Label Actions
export async function createLabel(data: LabelFormData) {
  const label = await prisma.label.create({
    data: {
      name: data.name,
      emoji: data.emoji || null,
      color: data.color || null,
    },
  });
  revalidatePath("/");
  return label;
}

export async function updateLabel(id: string, data: LabelFormData) {
  const label = await prisma.label.update({
    where: { id },
    data: {
      name: data.name,
      emoji: data.emoji || null,
      color: data.color || null,
    },
  });
  revalidatePath("/");
  return label;
}

export async function deleteLabel(id: string) {
  await prisma.label.delete({ where: { id } });
  revalidatePath("/");
}

export async function getLabels() {
  const labels = await prisma.label.findMany({
    orderBy: { createdAt: "asc" },
  });
  return labels;
}

// Task Actions
export async function createTask(data: TaskFormData) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate || null,
      deadline: data.deadline || null,
      reminder: data.reminder || null,
      estimate: data.estimate || null,
      priority: data.priority || "NONE",
      recurringType: data.recurringType || null,
      recurringCustom: data.recurringCustom || null,
      listId: data.listId || null,
      labels: data.labelIds ? { connect: data.labelIds.map((id) => ({ id })) } : undefined,
    },
    include: { labels: true, subtasks: true },
  });
  
  // Log task creation
  await prisma.taskLog.create({
    data: {
      action: "created",
      details: `Task "${data.title}" was created`,
      taskId: task.id,
    },
  });
  
  revalidatePath("/");
  return task;
}

export async function updateTask(id: string, data: Partial<TaskFormData>) {
  const currentTask = await prisma.task.findUnique({ where: { id } });
  
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description !== undefined ? (data.description || null) : undefined,
      dueDate: data.dueDate !== undefined ? (data.dueDate || null) : undefined,
      deadline: data.deadline !== undefined ? (data.deadline || null) : undefined,
      reminder: data.reminder !== undefined ? (data.reminder || null) : undefined,
      estimate: data.estimate !== undefined ? (data.estimate || null) : undefined,
      priority: data.priority,
      recurringType: data.recurringType !== undefined ? (data.recurringType || null) : undefined,
      recurringCustom: data.recurringCustom !== undefined ? (data.recurringCustom || null) : undefined,
      listId: data.listId !== undefined ? (data.listId || null) : undefined,
      labels: data.labelIds ? {
        set: data.labelIds.map((lid) => ({ id: lid })),
      } : undefined,
    },
    include: { labels: true, subtasks: true },
  });
  
  // Log changes
  if (currentTask && currentTask.title !== task.title) {
    await prisma.taskLog.create({
      data: {
        action: "updated",
        details: `Title changed from "${currentTask.title}" to "${task.title}"`,
        taskId: task.id,
      },
    });
  }
  
  revalidatePath("/");
  return task;
}

export async function toggleTaskComplete(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return null;
  
  const updated = await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
    include: { labels: true, subtasks: true },
  });
  
  // Log completion status change
  await prisma.taskLog.create({
    data: {
      action: updated.completed ? "completed" : "uncompleted",
      details: `Task was ${updated.completed ? "completed" : "marked as incomplete"}`,
      taskId: task.id,
    },
  });
  
  revalidatePath("/");
  return updated;
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/");
}

export async function getTasks(view?: string, listId?: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const where: Record<string, unknown> = {};
  
  if (listId) {
    where.listId = listId;
  }
  
  switch (view) {
    case "today":
      where.dueDate = {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      };
      break;
    case "week":
      where.dueDate = {
        gte: today,
        lt: nextWeek,
      };
      break;
    case "upcoming":
      where.dueDate = {
        gte: nextWeek,
      };
      break;
    case "all":
    default:
      // No filter - show all tasks
      break;
  }
  
  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      labels: true,
      subtasks: { orderBy: { createdAt: "asc" } },
      taskLogs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  
  return tasks;
}

export async function getTaskById(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      labels: true,
      subtasks: { orderBy: { createdAt: "asc" } },
      taskLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  return task;
}

// Subtask Actions
export async function createSubtask(taskId: string, title: string) {
  const subtask = await prisma.subtask.create({
    data: { title, taskId },
  });
  revalidatePath("/");
  return subtask;
}

export async function updateSubtask(id: string, title: string) {
  const subtask = await prisma.subtask.update({
    where: { id },
    data: { title },
  });
  revalidatePath("/");
  return subtask;
}

export async function toggleSubtaskComplete(id: string) {
  const subtask = await prisma.subtask.findUnique({ where: { id } });
  if (!subtask) return null;
  
  const updated = await prisma.subtask.update({
    where: { id },
    data: { completed: !subtask.completed },
  });
  revalidatePath("/");
  return updated;
}

export async function deleteSubtask(id: string) {
  await prisma.subtask.delete({ where: { id } });
  revalidatePath("/");
}

// Task Log Actions
export async function getTaskLogs(taskId: string) {
  const logs = await prisma.taskLog.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
  return logs;
}

// Search
export async function searchTasks(query: string) {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: { labels: true },
    orderBy: { createdAt: "desc" },
  });
  return tasks;
}

// Get overdue tasks count
export async function getOverdueCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await prisma.task.count({
    where: {
      completed: false,
      dueDate: { lt: today },
    },
  });
  return count;
}
