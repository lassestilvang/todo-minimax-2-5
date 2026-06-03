"use client";

import React, { useState, useMemo, memo } from "react";
import { format, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import {
  Check,
  Calendar,
  Flag,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Timer,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PRIORITY_COLORS } from "@/types";
import type { Task } from "@/types";
import { TimeTrackingDialog } from "@/components/time-tracking-dialog";

function formatDueDate(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  const days = differenceInDays(date, new Date());
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days <= 7) return `In ${days} days`;
  return format(date, "MMM d");
}

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask?: (id: string) => void;
  userId?: string;
  isLoading?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

function TaskCardComponent({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
  onToggleSubtask,
  userId = "default",
  isLoading,
  isSelected,
  onSelect,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    return isPast(dueDate) && !isToday(dueDate);
  }, [task.dueDate, task.completed]);

  const completedSubtasks = useMemo(
    () => task.subtasks?.filter((s) => s.completed).length || 0,
    [task.subtasks]
  );

  const totalSubtasks = useMemo(() => task.subtasks?.length || 0, [task.subtasks]);

  const priorityColor = task.priority !== "NONE" ? PRIORITY_COLORS[task.priority] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-xl border transition-all duration-200",
        isHovered && !task.completed && "shadow-lg shadow-black/5 dark:shadow-black/20",
        task.completed
          ? "bg-muted/30 dark:bg-muted/10 border-transparent"
          : "bg-card dark:bg-[#1a1a1a] border-border dark:border-zinc-800/50",
        isHovered && !task.completed && "border-primary/20 dark:border-primary/30"
      )}
      style={{
        transformOrigin: "center",
      }}
    >
      {/* Priority accent bar */}
      {priorityColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-opacity duration-200"
          style={{
            backgroundColor: priorityColor,
            opacity: isHovered ? 1 : 0.6,
          }}
        />
      )}

      <div className={cn("flex items-start gap-3 p-4", priorityColor && "pl-5")}>
        {/* Selection Checkbox */}
        <div className={cn(
          "mt-0.5 flex-shrink-0 transition-all duration-200",
          (isHovered || isSelected) ? "w-5 opacity-100" : "w-0 opacity-0 overflow-hidden"
        )}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect?.(task.id)}
            className="h-5 w-5 rounded-md border-2"
          />
        </div>

        {/* Checkbox */}
        <div className="mt-0.5 flex-shrink-0 relative">
          <motion.div
            initial={false}
            animate={isHovered || task.completed ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              disabled={isLoading}
              className={cn(
                "transition-all duration-200",
                isLoading && "opacity-50",
                task.completed && "scale-110"
              )}
            />
          </motion.div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2">
            <span className="relative inline-block min-w-0">
              <motion.span
                initial={false}
                animate={{
                  opacity: task.completed ? 0.5 : 1,
                }}
                className={cn(
                  "text-sm font-medium leading-tight block",
                  task.completed && "text-muted-foreground"
                )}
              >
                {task.title}
              </motion.span>
              <motion.span
                initial={false}
                animate={{ width: task.completed ? "100%" : "0%" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute left-0 top-1/2 -translate-y-1/2 h-[1px] bg-muted-foreground/60"
              />
            </span>
            {/* Priority indicator */}
            {task.priority !== "NONE" && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Flag
                  className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: priorityColor || undefined }}
                />
              </motion.div>
            )}
          </div>

          {/* Description preview */}
          <AnimatePresence mode="wait">
            {task.description && !isExpanded && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-1.5 text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed"
              >
                {task.description}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Labels */}
          <AnimatePresence mode="wait">
            {task.labels && task.labels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2.5 flex flex-wrap gap-1.5"
              >
                {task.labels.map((label) => (
                  <motion.span
                    key={label.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-transform duration-150 hover:scale-105"
                    style={{
                      backgroundColor: label.color ? `${label.color}18` : undefined,
                      color: label.color || undefined,
                      borderWidth: 1,
                      borderColor: label.color ? `${label.color}40` : undefined,
                    }}
                  >
                    {label.emoji} {label.name}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Meta info */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/70">
            {task.dueDate && (
              <motion.span
                initial={false}
                animate={{
                  color: isOverdue ? "rgb(239, 68, 68)" : undefined,
                  fontWeight: isOverdue ? 600 : undefined,
                }}
                className="inline-flex items-center gap-1.5 transition-colors duration-150"
              >
                <Calendar className="h-3.5 w-3.5" />
                {formatDueDate(new Date(task.dueDate))}
              </motion.span>
            )}

            {/* Time Tracking Badge */}
            {(task.estimate || (task.actualTime && task.actualTime > 0)) && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTimeDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/80 dark:bg-muted/50 px-2.5 py-0.5 text-xs font-medium transition-colors duration-150 hover:bg-muted hover:dark:bg-muted/70"
                aria-label="Track time"
              >
                <Timer className="h-3.5 w-3.5" />
                {task.estimate && (
                  <span>Est: {Math.floor(task.estimate / 60)}h {task.estimate % 60}m</span>
                )}
                {task.actualTime && task.actualTime > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    / {Math.floor(task.actualTime / 60)}h {task.actualTime % 60}m
                  </span>
                )}
              </motion.button>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                {task.attachments.length}
              </span>
            )}

            {/* Subtasks */}
            {totalSubtasks > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>

          {/* Expanded subtasks */}
          <AnimatePresence>
            {isExpanded && totalSubtasks > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {task.subtasks?.map((subtask, idx) => (
                  <motion.div
                    key={subtask.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2.5 py-1"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => onToggleSubtask?.(subtask.id)}
                    />
                    <span
                      className={cn(
                        "text-sm transition-all duration-150",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.title}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <motion.div
          initial={false}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.9,
          }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-0.5"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse task" : "Expand task"}
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
            className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Time Tracking Dialog */}
      {showTimeDialog && (
        <TimeTrackingDialog
          taskId={task.id}
          isOpen={showTimeDialog}
          onClose={() => setShowTimeDialog(false)}
          userId={userId}
        />
      )}
    </motion.div>
  );
}

export const TaskCard = memo(TaskCardComponent);