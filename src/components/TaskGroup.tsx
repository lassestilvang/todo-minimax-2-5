"use client";

import React from "react";
import { Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskCard } from "./SortableTaskCard";

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onToggleSubtask: (id: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onFocus?: (task: Task) => void;
  onReorder?: (tasks: Task[]) => void;
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
  onFocus,
  onReorder,
  userId = "default",
  selectedTaskIds,
  onSelectTask,
}: TaskGroupProps) {
  const sensors = useSensors(useSensor(PointerSensor));

  if (tasks.length === 0) return null;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id && onReorder) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = [...tasks];
      const [movedItem] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, movedItem);
      onReorder(newTasks);
    }
  };

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            <AnimatePresence>
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onToggleSubtask={onToggleSubtask}
                  onAddSubtask={onAddSubtask}
                  onFocus={onFocus}
                  userId={userId}
                  isSelected={selectedTaskIds?.has(task.id)}
                  onSelect={onSelectTask}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

TaskGroupComponent.displayName = "TaskGroup";
export const TaskGroup = React.memo(TaskGroupComponent);
