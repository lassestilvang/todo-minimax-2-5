"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { X, ChevronDown, Plus, Trash2, ListChecks } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AttachmentUpload } from "@/components/attachment-upload";
import { AttachmentList } from "@/components/attachment-list";
import {
  deleteAttachment,
  getTaskById,
  createSubtask,
  updateSubtask,
  toggleSubtaskComplete,
  deleteSubtask,
} from "@/app/actions";
import { useToast } from "@/components/ui/toast";
import type { Task, List, Label, RecurringType, Subtask, TaskFormData } from "@/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  reminder: z.date().optional(),
  estimate: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]),
  recurringType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"]).optional(),
  recurringCustom: z.string().optional(),
  listId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  task?: Task | null;
  lists: List[];
  labels: Label[];
  onTaskChange?: (task: Task) => void;
}

export function TaskForm({ isOpen, onClose, onSubmit, task, lists, labels, onTaskChange }: TaskFormProps) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "NONE",
      recurringType: undefined,
      recurringCustom: "",
      listId: "",
      labelIds: [],
      dueDate: undefined,
      deadline: undefined,
      reminder: undefined,
    },
  });

  // Watch labelIds from form
  const watchedLabelIds = useWatch({ control, name: "labelIds" }) ?? [];
  // Watch dueDate from form
  const watchedDueDate = useWatch({ control, name: "dueDate" });
  // Watch deadline from form
  const watchedDeadline = useWatch({ control, name: "deadline" });
  // Watch reminder from form
  const watchedReminder = useWatch({ control, name: "reminder" });

  // Subtask editor local state
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks ?? []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [subtaskBusy, setSubtaskBusy] = useState(false);
  const newSubtaskRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSubtasks(task?.subtasks ?? []);
      setNewSubtaskTitle("");
      setEditingSubtaskId(null);
      setEditingSubtaskTitle("");
    }
  }, [task, isOpen]);

  // Reset form when task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          recurringType: task.recurringType as RecurringType | undefined,
          recurringCustom: task.recurringCustom || "",
          listId: task.listId || "",
          labelIds: task.labels?.map((l) => l.id) || [],
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
          reminder: task.reminder ? new Date(task.reminder) : undefined,
        });
      } else {
        reset({
          title: "",
          description: "",
          priority: "NONE",
          recurringType: undefined,
          recurringCustom: "",
          listId: "",
          labelIds: [],
          dueDate: undefined,
          deadline: undefined,
          reminder: undefined,
        });
      }
    }
  }, [task, reset, isOpen]);

  const toggleLabel = (labelId: string) => {
    const current = watchedLabelIds || [];
    const newLabels = current.includes(labelId)
      ? current.filter((id) => id !== labelId)
      : [...current, labelId];
    setValue("labelIds", newLabels, { shouldValidate: true });
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleFormSubmit = (data: z.infer<typeof taskSchema>) => {
    const estimateNum =
      typeof data.estimate === "string" && data.estimate.trim() !== ""
        ? Number(data.estimate)
        : undefined;
    onSubmit({
      ...data,
      estimate: Number.isFinite(estimateNum) ? estimateNum : undefined,
      dueDate: watchedDueDate,
      deadline: watchedDeadline,
      reminder: watchedReminder,
      labelIds: watchedLabelIds,
    } as TaskFormData);
    onClose();
  };

  // Ctrl+Enter to submit from any field, including textarea
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  const handleDueDateChange = (value: string) => {
    setValue("dueDate", value ? new Date(value) : undefined, { shouldValidate: false });
  };

  const refreshTask = useCallback(async () => {
    if (task && onTaskChange) {
      const updated = await getTaskById(task.id);
      if (updated) onTaskChange(updated);
    }
  }, [task, onTaskChange]);

  const handleDeleteAttachment = async (id: string) => {
    await deleteAttachment(id);
    await refreshTask();
  };

  const handleUploadComplete = async () => {
    await refreshTask();
  };

  // Subtask handlers — only available when editing an existing task
  const canManageSubtasks = !!task?.id;

  const handleAddSubtask = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!task?.id) return;
      const title = newSubtaskTitle.trim();
      if (!title || subtaskBusy) return;
      setSubtaskBusy(true);
      try {
        const created = await createSubtask(task.id, title);
        setSubtasks((prev) => [...prev, created]);
        setNewSubtaskTitle("");
        newSubtaskRef.current?.focus();
        await refreshTask();
      } catch {
        showToast("Failed to add subtask", "error");
      } finally {
        setSubtaskBusy(false);
      }
    },
    [task?.id, newSubtaskTitle, subtaskBusy, refreshTask, showToast]
  );

  const handleToggleSubtask = useCallback(
    async (id: string) => {
      // Optimistic toggle
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
      );
      try {
        await toggleSubtaskComplete(id);
        await refreshTask();
      } catch {
        setSubtasks((prev) =>
          prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
        );
        showToast("Failed to toggle subtask", "error");
      }
    },
    [refreshTask, showToast]
  );

  const startEditSubtask = useCallback((subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  }, []);

  const saveSubtaskEdit = useCallback(
    async (id: string) => {
      const title = editingSubtaskTitle.trim();
      if (!title) {
        setEditingSubtaskId(null);
        return;
      }
      try {
        const updated = await updateSubtask(id, title);
        setSubtasks((prev) => prev.map((s) => (s.id === id ? updated : s)));
        setEditingSubtaskId(null);
        setEditingSubtaskTitle("");
      } catch {
        showToast("Failed to update subtask", "error");
      }
    },
    [editingSubtaskTitle, showToast]
  );

  const handleDeleteSubtask = useCallback(
    async (id: string) => {
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
      try {
        await deleteSubtask(id);
        await refreshTask();
      } catch {
        showToast("Failed to delete subtask", "error");
      }
    },
    [refreshTask, showToast]
  );

  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskProgress =
    totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="task-title-input" className="text-sm font-medium">Title</label>
            <Input
              id="task-title-input"
              {...register("title")}
              placeholder="Task title"
              autoComplete="off"
              autoFocus
              className={cn("mt-1", errors.title && "border-destructive")}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-description" className="text-sm font-medium">Description</label>
            <Textarea
              id="task-description"
              {...register("description")}
              placeholder="Add a description..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="task-due-date" className="text-sm font-medium">Due Date</label>
            <div className="mt-1 flex gap-2">
              <Input
                id="task-due-date"
                type="date"
                value={watchedDueDate ? format(watchedDueDate, "yyyy-MM-dd") : ""}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="flex-1"
              />
              {watchedDueDate ? (
                <Button type="button" variant="ghost" size="icon" onClick={() => setValue("dueDate", undefined)}>
                  <X className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      setValue("dueDate", today);
                    }}
                    className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(0, 0, 0, 0);
                      setValue("dueDate", tomorrow);
                    }}
                    className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Tomorrow
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="task-deadline" className="text-sm font-medium">Deadline</label>
            <div className="mt-1 flex gap-2">
              <Input
                id="task-deadline"
                type="date"
                value={watchedDeadline ? format(watchedDeadline, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setValue("deadline", e.target.value ? new Date(e.target.value) : undefined, {
                    shouldValidate: false,
                  })
                }
                className="flex-1"
              />
              {watchedDeadline && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setValue("deadline", undefined)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label htmlFor="task-reminder" className="text-sm font-medium">Reminder</label>
            <div className="mt-1 flex gap-2">
              <Input
                id="task-reminder"
                type="datetime-local"
                value={watchedReminder ? format(watchedReminder, "yyyy-MM-dd'T'HH:mm") : ""}
                onChange={(e) =>
                  setValue("reminder", e.target.value ? new Date(e.target.value) : undefined, {
                    shouldValidate: false,
                  })
                }
                className="flex-1"
              />
              {watchedReminder && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setValue("reminder", undefined)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <div className="relative mt-1">
              <select
                {...register("priority")}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="NONE">None</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground/70" />
            </div>
          </div>

          {/* List */}
          <div>
            <label className="text-sm font-medium">List</label>
            <div className="relative mt-1">
              <select
                {...register("listId")}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No list</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.emoji} {list.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground/70" />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-medium">Labels</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors",
                    (watchedLabelIds || []).includes(label.id) ? "bg-opacity-100" : "bg-opacity-20 hover:bg-opacity-40"
                  )}
                  style={{
                    backgroundColor: (watchedLabelIds || []).includes(label.id)
                      ? label.color || "#6b7280"
                      : label.color
                      ? `${label.color}30`
                      : "#6b728030",
                    color: (watchedLabelIds || []).includes(label.id) ? "white" : label.color || "#6b7280",
                  }}
                >
                  {label.emoji} {label.name}
                </button>
              ))}
              {labels.length === 0 && <p className="text-sm text-muted-foreground">No labels yet</p>}
            </div>
          </div>

          {/* Estimate */}
          <div>
            <label htmlFor="task-estimate" className="text-sm font-medium">
              Time Estimate (minutes)
            </label>
            <Input
              id="task-estimate"
              type="number"
              {...register("estimate")}
              placeholder="e.g. 60"
              className="mt-1"
              min={0}
              max={100000}
            />
          </div>

          {/* Recurring */}
          <div>
            <label className="text-sm font-medium">Recurring</label>
            <div className="relative mt-1">
              <select
                {...register("recurringType")}
                className="flex h-10 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-10 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Never</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-4 w-4 text-muted-foreground/70" />
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <ListChecks className="h-4 w-4" />
                Subtasks
                {totalSubtasks > 0 && (
                  <span className="text-xs text-muted-foreground font-normal">
                    ({completedSubtasks}/{totalSubtasks})
                  </span>
                )}
              </label>
            </div>
            {totalSubtasks > 0 && (
              <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${subtaskProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            )}
            <div className="mt-2 space-y-1">
              <AnimatePresence initial={false}>
                {subtasks.map((subtask) => (
                  <motion.div
                    key={subtask.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 rounded-md border bg-card/50 px-2 py-1.5 group"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="h-4 w-4 rounded border-2 cursor-pointer accent-primary"
                    />
                    {editingSubtaskId === subtask.id ? (
                      <Input
                        value={editingSubtaskTitle}
                        onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                        onBlur={() => saveSubtaskEdit(subtask.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveSubtaskEdit(subtask.id);
                          } else if (e.key === "Escape") {
                            setEditingSubtaskId(null);
                          }
                        }}
                        autoFocus
                        className="h-7 text-sm flex-1"
                      />
                    ) : (
                      <span
                        onClick={() => startEditSubtask(subtask)}
                        className={cn(
                          "flex-1 text-sm cursor-text rounded px-1 py-0.5 -mx-1 hover:bg-accent/40 transition-colors",
                          subtask.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {subtask.title}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                      aria-label={`Delete subtask ${subtask.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {canManageSubtasks ? (
              <div className="mt-2 flex gap-2">
                <Input
                  ref={newSubtaskRef}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1"
                  maxLength={200}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAddSubtask()}
                  disabled={!newSubtaskTitle.trim() || subtaskBusy}
                  aria-label="Add subtask"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground italic">
                Save the task first, then add subtasks.
              </p>
            )}
          </div>

          {/* Attachments */}
          {task && (
            <div>
              <label className="text-sm font-medium">Attachments</label>
              <AttachmentUpload
                taskId={task.id}
                onUploadComplete={handleUploadComplete}
                onError={(error) => console.error(error)}
              />
              {/* Display existing attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="mt-4">
                  <AttachmentList
                    attachments={task.attachments}
                    onDelete={handleDeleteAttachment}
                    onDownload={() => {}}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="items-center">
            <span className="text-[10px] text-muted-foreground/50 font-medium mr-auto hidden sm:inline">
              ⌘Enter to save
            </span>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {task ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
