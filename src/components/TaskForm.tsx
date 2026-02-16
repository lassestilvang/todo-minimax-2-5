"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { X } from "lucide-react";
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
import type { Task, List, Label, Priority, RecurringType, TaskFormData } from "@/types";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  deadline: z.date().optional(),
  reminder: z.date().optional(),
  estimate: z.number().optional(),
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
}

export function TaskForm({ isOpen, onClose, onSubmit, task, lists, labels }: TaskFormProps) {
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  );
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    task?.labels?.map((l) => l.id) || []
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "NONE",
      recurringType: task?.recurringType as RecurringType | undefined,
      recurringCustom: task?.recurringCustom || "",
      listId: task?.listId || "",
      labelIds: task?.labels?.map((l) => l.id) || [],
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        recurringType: task.recurringType as RecurringType | undefined,
        recurringCustom: task.recurringCustom || "",
        listId: task.listId || "",
        labelIds: task.labels?.map((l) => l.id) || [],
      });
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setSelectedLabels(task.labels?.map((l) => l.id) || []);
    } else {
      reset({
        title: "",
        description: "",
        priority: "NONE",
        recurringType: undefined,
        recurringCustom: "",
        listId: "",
        labelIds: [],
      });
      setDueDate(undefined);
      setSelectedLabels([]);
    }
  }, [task, reset, isOpen]);

  const handleFormSubmit = (data: z.infer<typeof taskSchema>) => {
    onSubmit({
      ...data,
      dueDate,
      labelIds: selectedLabels,
    } as TaskFormData);
    onClose();
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Input
              {...register("title")}
              placeholder="Task title"
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Textarea {...register("description")} placeholder="Add a description..." rows={3} />
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <div className="mt-1 flex gap-2">
              <Input
                type="date"
                value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setDueDate(e.target.value ? new Date(e.target.value) : undefined)
                }
                className="flex-1"
              />
              {dueDate && (
                <Button type="button" variant="ghost" size="icon" onClick={() => setDueDate(undefined)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-sm font-medium">Priority</label>
            <select
              {...register("priority")}
              className="mt-1 flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="NONE">None</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* List */}
          <div>
            <label className="text-sm font-medium">List</label>
            <select
              {...register("listId")}
              className="mt-1 flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No list</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.emoji} {list.name}
                </option>
              ))}
            </select>
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
                    selectedLabels.includes(label.id) ? "bg-opacity-100" : "bg-opacity-20 hover:bg-opacity-40"
                  )}
                  style={{
                    backgroundColor: selectedLabels.includes(label.id)
                      ? label.color || "#6b7280"
                      : label.color
                      ? `${label.color}30`
                      : "#6b728030",
                    color: selectedLabels.includes(label.id) ? "white" : label.color || "#6b7280",
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
            <label className="text-sm font-medium">Time Estimate (minutes)</label>
            <Input
              type="number"
              {...register("estimate", { valueAsNumber: true })}
              placeholder="e.g. 60"
              className="mt-1"
              min={0}
            />
          </div>

          {/* Recurring */}
          <div>
            <label className="text-sm font-medium">Recurring</label>
            <select
              {...register("recurringType")}
              className="mt-1 flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Never</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <DialogFooter>
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
