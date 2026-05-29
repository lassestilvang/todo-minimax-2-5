"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Plus, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Sidebar } from "@/components/Sidebar";
import { TaskCard } from "@/components/TaskCard";
import { TaskForm } from "@/components/TaskForm";
import { SearchBar } from "@/components/SearchBar";
import { ViewToggle } from "@/components/ViewToggle";
import { EmptyState } from "@/components/EmptyState";
import { ActiveTimersIndicator } from "@/components/active-timers";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { Task, List, Label, TaskFormData, ViewType } from "@/types";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  toggleSubtaskComplete,
  getTasks,
} from "./actions";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface HomeClientProps {
  initialTasks: Task[];
  initialLists: List[];
  initialLabels: Label[];
}

export function HomeClient({ initialTasks, initialLists, initialLabels }: HomeClientProps) {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [lists] = useState<List[]>(initialLists);
  const [labels] = useState<Label[]>(initialLabels);
  const [, startTransition] = useTransition();
  const [showCompleted, setShowCompleted] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useKeyboardShortcuts([
    { key: "n", ctrl: true, action: () => setIsTaskFormOpen(true) },
    { key: "Escape", action: () => { setIsTaskFormOpen(false); setEditingTask(null); setIsShortcutsOpen(false); } },
    { key: "?", action: () => setIsShortcutsOpen((prev) => !prev) },
  ]);

  // Get params
  const currentView = (searchParams.get("view") as ViewType) || "all";
  const currentListId = searchParams.get("list") || undefined;
  const currentLabelId = searchParams.get("label") || undefined;

  // Get current list
  const currentList = lists.find((l) => l.id === currentListId);
  // Get current label
  const currentLabel = labels.find((l) => l.id === currentLabelId);

  // Filter tasks by completion status
  const visibleTasks = useMemo(
    () =>
      showCompleted
        ? tasks
        : tasks.filter((t) => !t.completed),
    [tasks, showCompleted]
  );

  // Get overdue count
  const overdueCount = useMemo(
    () =>
      tasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
      ).length,
    [tasks]
  );

  // Get completed count
  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  // Handlers
  const handleCreateTask = useCallback((data: TaskFormData) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      title: data.title,
      description: data.description || null,
      completed: false,
      dueDate: data.dueDate || null,
      deadline: data.deadline || null,
      reminder: data.reminder || null,
      estimate: data.estimate || null,
      actualTime: null,
      priority: data.priority,
      recurringType: data.recurringType || null,
      recurringCustom: data.recurringCustom || null,
      attachmentUrl: null,
      listId: data.listId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      labels: data.labelIds ? labels.filter((l) => data.labelIds?.includes(l.id)) : [],
      subtasks: [],
      attachments: [],
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    startTransition(async () => {
      try {
        const newTask = await createTask(data);
        setTasks((prev) => prev.map((t) => (t.id === tempId ? newTask : t)));
      } catch {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        showToast("Failed to create task");
      }
    });
  }, [labels, showToast]);

  const handleUpdateTask = useCallback((data: TaskFormData) => {
    if (!editingTask) return;
    const previousTask = editingTask;
    const updatedTask: Task = {
      ...editingTask,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate || null,
      deadline: data.deadline || null,
      reminder: data.reminder || null,
      estimate: data.estimate || null,
      priority: data.priority,
      recurringType: data.recurringType || null,
      recurringCustom: data.recurringCustom || null,
      listId: data.listId || null,
      labels: data.labelIds ? labels.filter((l) => data.labelIds?.includes(l.id)) : [],
    };

    setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updatedTask : t)));
    setEditingTask(null);

    startTransition(async () => {
      try {
        const updated = await updateTask(previousTask.id, data);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } catch {
        setTasks((prev) => prev.map((t) => (t.id === previousTask.id ? previousTask : t)));
        showToast("Failed to update task");
      }
    });
  }, [editingTask, labels, showToast]);

  const handleToggleComplete = useCallback((id: string) => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    startTransition(async () => {
      try {
        const updated = await toggleTaskComplete(id);
        if (updated) {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }
      } catch {
        // Revert toggle on error
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        );
        showToast("Failed to toggle task");
      }
    });
  }, [showToast]);

  const handleDeleteTask = useCallback((id: string) => {
    let deletedTask: Task | undefined;
    
    // Optimistic delete
    setTasks((prev) => {
      deletedTask = prev.find((t) => t.id === id);
      return prev.filter((t) => t.id !== id);
    });

    startTransition(async () => {
      try {
        await deleteTask(id);
      } catch {
        // Revert delete on error
        if (deletedTask) {
          const taskToRestore = deletedTask;
          setTasks((prev) => [taskToRestore, ...prev]);
        }
        showToast("Failed to delete task");
      }
    });
  }, [showToast]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    // Optimistic toggle subtask
    setTasks((prev) =>
      prev.map((task) => {
        const subtasks = task.subtasks?.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...task, subtasks };
      })
    );

    startTransition(async () => {
      try {
        await toggleSubtaskComplete(subtaskId);
        const result = await getTasks(currentView, currentListId, currentLabelId);
        setTasks(Array.isArray(result) ? result : result.tasks);
      } catch {
        // Revert toggle subtask on error
        setTasks((prev) =>
          prev.map((task) => {
            const subtasks = task.subtasks?.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...task, subtasks };
          })
        );
        showToast("Failed to toggle subtask");
      }
    });
  }, [currentView, currentListId, currentLabelId, showToast]);

  const handleSelectTaskFromSearch = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const pageTitle = useMemo(() => {
    if (currentLabel) {
      return `${currentLabel.emoji || "🏷️"} ${currentLabel.name}`.trim();
    }
    if (currentList) {
      return `${currentList.emoji || ""} ${currentList.name}`.trim();
    }
    switch (currentView) {
      case "today":
        return "Today's Tasks";
      case "week":
        return "Next 7 Days";
      case "upcoming":
        return "Upcoming";
      default:
        return "All Tasks";
    }
  }, [currentList, currentLabel, currentView]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        lists={lists}
        labels={labels}
        overdueCount={overdueCount}
        currentListId={currentListId}
        currentLabelId={currentLabelId}
        currentView={currentView}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">{pageTitle}</h1>
                {currentView !== "all" && (
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                  </p>
                )}
              </div>
              <Button onClick={() => setIsTaskFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <SearchBar tasks={tasks} onSelectTask={handleSelectTaskFromSearch} />
              </div>
              <ViewToggle currentView={currentView} />
            </div>
          </div>

          {/* Toggle completed */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showCompleted ? (
                <>
                  <Eye className="h-4 w-4" />
                  Hide completed
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" />
                  Show completed
                </>
              )}
            </button>
            {completedCount > 0 && (
              <Badge variant="secondary">
                {completedCount} completed
              </Badge>
            )}
          </div>

          {/* Task List */}
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {visibleTasks.length === 0 ? (
                <EmptyState
                  title="No tasks found"
                  description={
                    currentView === "today"
                      ? "You have no tasks due today. Enjoy your day!"
                      : "Create your first task to get started"
                  }
                  actionLabel="Create Task"
                  onAction={() => setIsTaskFormOpen(true)}
                />
              ) : (
                visibleTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.05, 0.3),
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    layout
                  >
                    <TaskCard
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                      onToggleSubtask={handleToggleSubtask}
                      userId="default"
                    />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={editingTask}
        lists={lists}
        labels={labels}
        onTaskChange={(updatedTask) => setEditingTask(updatedTask)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Floating Active Timers Widget */}
      <ActiveTimersIndicator userId="default" />
    </div>
  );
}
