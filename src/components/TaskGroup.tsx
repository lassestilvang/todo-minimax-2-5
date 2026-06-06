"use client";

import React from "react";
import { Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { motion, AnimatePresence } from "framer-motion";

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  userId?: string;
  selectedTaskIds?: Set<string>;
  onSelectTask?: (id: string) => void;
}

function TaskGroupComponent({
  title,
  tasks,
  onToggleComplete,
  onDelete,
  onEdit,
  onToggleSubtask,
  onAddSubtask,
  userId = "default",
  selectedTaskIds,
  onSelectTask,
}: TaskGroupProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3 mb-8">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground/50 bg-muted px-1.5 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
              layout
            >
              <TaskCard
                task={task}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggleSubtask={onToggleSubtask}
                onAddSubtask={onAddSubtask}
                userId={userId}
                isSelected={selectedTaskIds?.has(task.id)}
                onSelect={onSelectTask}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

TaskGroupComponent.displayName = "TaskGroup";
export const TaskGroup = React.memo(TaskGroupComponent);
