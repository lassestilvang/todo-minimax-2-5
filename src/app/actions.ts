"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ListFormData, LabelFormData, TaskFormData } from "@/types";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// List Actions
export async function createList(data: ListFormData) {
  const name = data.name?.trim();
  if (!name) {
    throw new Error("List name is required");
  }
  const list = await prisma.list.create({
    data: {
      name,
      emoji: data.emoji?.trim() || null,
      color: data.color || null,
      isDefault: false,
    },
  });
  revalidatePath("/");
  return list;
}

export async function updateList(id: string, data: ListFormData) {
  const name = data.name?.trim();
  if (!name) {
    throw new Error("List name is required");
  }
  const list = await prisma.list.update({
    where: { id },
    data: {
      name,
      emoji: data.emoji?.trim() || null,
      color: data.color || null,
    },
  });
  revalidatePath("/");
  return list;
}

export async function deleteList(id: string) {
  const list = await prisma.list.findUnique({ where: { id } });
  if (list?.isDefault) {
    throw new Error("Cannot delete the default inbox");
  }

  await prisma.task.updateMany({
    where: { listId: id },
    data: { listId: null },
  });

  await prisma.list.delete({ where: { id } });
  revalidatePath("/");
}

export async function getLists() {
  try {
    const lists = await prisma.list.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return lists;
  } catch (error) {
    console.error("Failed to get lists:", error);
    return [];
  }
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
  const name = data.name?.trim();
  if (!name) {
    throw new Error("Label name is required");
  }
  const label = await prisma.label.create({
    data: {
      name,
      emoji: data.emoji?.trim() || null,
      color: data.color || null,
    },
  });
  revalidatePath("/");
  return label;
}

export async function updateLabel(id: string, data: LabelFormData) {
  const name = data.name?.trim();
  if (!name) {
    throw new Error("Label name is required");
  }
  const label = await prisma.label.update({
    where: { id },
    data: {
      name,
      emoji: data.emoji?.trim() || null,
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
  try {
    const labels = await prisma.label.findMany({
      orderBy: { createdAt: "asc" },
    });
    return labels;
  } catch (error) {
    console.error("Failed to get labels:", error);
    return [];
  }
}

// Task Actions
export async function createTask(data: TaskFormData) {
  const title = data.title?.trim();
  if (!title) {
    throw new Error("Task title is required");
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: data.description?.trim() || null,
      dueDate: data.dueDate || null,
      deadline: data.deadline || null,
      reminder: data.reminder || null,
      estimate: data.estimate || null,
      priority: data.priority || "NONE",
      recurringType: data.recurringType || null,
      recurringCustom: data.recurringCustom?.trim() || null,
      listId: data.listId || null,
      labels: data.labelIds ? { connect: data.labelIds.map((id) => ({ id })) } : undefined,
    },
    include: { labels: true, subtasks: true },
  });

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
      title: data.title?.trim(),
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
  const attachments = await prisma.attachment.findMany({
    where: { taskId: id },
  });

  for (const att of attachments) {
    await deleteFile(att.path);
  }

  await prisma.task.delete({ where: { id } });
  revalidatePath("/");
}

export async function getTasks(view?: string, listId?: string, cursor?: string, limit = 50) {
  try {
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
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      include: {
        labels: true,
        subtasks: { orderBy: { createdAt: "asc" } },
        taskLogs: { orderBy: { createdAt: "desc" }, take: 10 },
        timeLogs: { orderBy: { startTime: "desc" } },
        attachments: true,
      },
    });

    let nextCursor: string | undefined;
    if (tasks.length > limit) {
      const nextItem = tasks.pop();
      nextCursor = nextItem?.id;
    }

    return { tasks, nextCursor };
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return { tasks: [], nextCursor: undefined };
  }
}

export async function getTaskById(id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        labels: true,
        subtasks: { orderBy: { createdAt: "asc" } },
        taskLogs: { orderBy: { createdAt: "desc" } },
        timeLogs: { orderBy: { startTime: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });
    return task;
  } catch (error) {
    console.error("Failed to get task:", error);
    return null;
  }
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

// Time Log Actions
export async function getTimeLogs(taskId: string) {
  const logs = await prisma.timeLog.findMany({
    where: { taskId },
    orderBy: { startTime: "desc" },
  });
  return logs;
}

export async function startTimer(taskId: string, userId: string) {
  // Stop any existing timer for this user first
  await stopTimer(taskId, userId);

  const timeLog = await prisma.timeLog.create({
    data: {
      taskId,
      userId,
      startTime: new Date(),
      endTime: null,
      duration: null,
    },
  });

  // Update task's actualTime
  await updateTaskActualTime(taskId);

  return timeLog;
}

export async function stopTimer(taskId: string, userId: string) {
  const activeLog = await prisma.timeLog.findFirst({
    where: {
      taskId,
      userId,
      endTime: null,
    },
    orderBy: { startTime: "desc" },
  });

  if (!activeLog) return null;

  const endTime = new Date();
  const durationMinutes = Math.round(
    (endTime.getTime() - new Date(activeLog.startTime).getTime()) / (1000 * 60)
  );

  const updatedLog = await prisma.timeLog.update({
    where: { id: activeLog.id },
    data: {
      endTime,
      duration: durationMinutes,
    },
  });

  // Update task's actualTime
  await updateTaskActualTime(taskId);

  return updatedLog;
}

export async function addManualTimeEntry(
  taskId: string,
  date: string,
  durationMinutes: number,
  notes?: string,
  userId = "default"
) {
  const startTime = new Date(date);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

  const timeLog = await prisma.timeLog.create({
    data: {
      taskId,
      userId,
      startTime,
      endTime,
      duration: durationMinutes,
      notes,
    },
  });

  // Update task's actualTime
  await updateTaskActualTime(taskId);

  return timeLog;
}

async function updateTaskActualTime(taskId: string) {
  const totalMinutes = await prisma.timeLog.aggregate({
    where: { taskId },
    _sum: { duration: true },
  });

  const total = totalMinutes._sum.duration || 0;

  await prisma.task.update({
    where: { id: taskId },
    data: { actualTime: total },
  });
}

export async function deleteTimeLog(id: string) {
  const log = await prisma.timeLog.findUnique({ where: { id } });
  if (!log) return;

  await prisma.timeLog.delete({ where: { id } });

  // Update task's actualTime
  await updateTaskActualTime(log.taskId);
}

// Attachment Actions
export async function getAttachments(taskId: string) {
  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
  return attachments;
}

export async function uploadAttachment(
  taskId: string,
  filename: string,
  path: string,
  size: number,
  mimeType: string
) {
  const attachment = await prisma.attachment.create({
    data: {
      taskId,
      filename,
      path,
      size,
      mimeType,
    },
  });

  revalidatePath(`/tasks/${taskId}`);
  return attachment;
}

export async function uploadAttachments(taskId: string, formData: FormData) {
  const files = formData.getAll("files") as File[];
  const results = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const dir = path.join(process.cwd(), "data", "attachments");
    const filePath = path.join(dir, filename);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(filePath, buffer);

    // Create DB record
    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        filename: file.name,
        path: filePath,
        size: file.size,
        mimeType: file.type,
      },
    });

    results.push(attachment);
  }

  // Update task's attachment count via a separate field if needed, or just return
  revalidatePath(`/tasks/${taskId}`);
  return results;
}

export async function deleteAttachment(id: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return;

  await deleteFile(attachment.path);

  await prisma.attachment.delete({ where: { id } });
  revalidatePath(`/tasks/${attachment.taskId}`);
}

// Helper function to delete file from filesystem
async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // File already deleted or doesn't exist - non-fatal
  }
}

// Search
export async function searchTasks(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { title: { contains: trimmed } },
        { description: { contains: trimmed } },
      ],
    },
    include: { labels: true },
    orderBy: { createdAt: "desc" },
    take: 50,
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
