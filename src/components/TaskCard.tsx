"use client";

import React, { useState } from "react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import {
  Check,
  Calendar,
  Clock,
  Flag,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_COLORS } from "@/types";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskCard({ task, onToggleComplete, onDelete, onEdit }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isOverdue =
    task.dueDate && !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    const days = differenceInDays(date, new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days <= 7) return `In ${days} days`;
    return format(date, "MMM d");
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-transparent bg-card dark:bg-[#1a1a1a] p-4 transition-all hover:border-border dark:hover:border-zinc-700",
        task.completed && "opacity-60"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          className="mt-1 flex-shrink-0"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                task.completed && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </span>
            {/* Priority indicator */}
            {task.priority !== "NONE" && (
              <Flag
                className="h-4 w-4 flex-shrink-0"
                style={{ color: PRIORITY_COLORS[task.priority] }}
              />
            )}
          </div>

          {/* Description preview */}
          {task.description && !isExpanded && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Expanded description */}
          {task.description && isExpanded && (
            <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: label.color ? `${label.color}20` : undefined,
                    color: label.color || undefined,
                  }}
                >
                  {label.emoji} {label.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Meta info */}
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-500 font-medium"
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDueDate(new Date(task.dueDate))}
              </span>
            )}
            {task.estimate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(task.estimate / 60)}h {task.estimate % 60}m
              </span>
            )}
            {task.attachmentUrl && (
              <span className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                1
              </span>
            )}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>

          {/* Expanded subtasks */}
          {isExpanded && totalSubtasks > 0 && (
            <div className="mt-3 space-y-2">
              {task.subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => {
                      // Handle subtask toggle
                    }}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      subtask.completed && "line-through text-muted-foreground"
                    )}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(task)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
