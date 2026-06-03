"use client";

import React, { useState, useTransition, useMemo, useCallback, useOptimistic } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Plus, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Sidebar } from "@/components/Sidebar";
import { TaskCard } from "@/components/TaskCard";
import { TaskGroup } from "@/components/TaskGroup";
import { BulkActionToolbar } from "@/components/BulkActionToolbar";
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
import {
  isToday,
  isTomorrow,
  isPast,
  addDays,
  startOfDay,
} from "date-fns";

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
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const handleSelectTask = useCallback((id: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const handleBulkToggleComplete = useCallback(() => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      // Optimistic toggle all
      ids.forEach((id) => addOptimisticTaskAction({ type: "toggle", payload: { id } }));
      
      try {
        await Promise.all(ids.map((id) => toggleTaskComplete(id)));
        const result = await getTasks(currentView, currentListId, currentLabelId);
        setTasks(Array.isArray(result) ? result : result.tasks);
        setSelectedTaskIds(new Set());
      } catch {
        showToast("Failed to toggle some tasks");
      }
    });
  }, [selectedTaskIds, addOptimisticTaskAction, currentView, currentListId, currentLabelId, showToast]);

  const handleBulkDelete = useCallback(() => {
    const ids = Array.from(selectedTaskIds);
    if (ids.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${ids.length} tasks?`)) return;

    startTransition(async () => {
      // Optimistic delete all
      ids.forEach((id) => addOptimisticTaskAction({ type: "delete", payload: { id } }));

      try {
        await Promise.all(ids.map((id) => deleteTask(id)));
        setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
        setSelectedTaskIds(new Set());
      } catch {
        showToast("Failed to delete some tasks");
      }
    });
  }, [selectedTaskIds, addOptimisticTaskAction, showToast]);

  const [optimisticTasks, addOptimisticTaskAction] = useOptimistic(
    tasks,
    (state, action: { type: string; payload: any }) => {
      switch (action.type) {
        case "toggle":
          return state.map((t) =>
            t.id === action.payload.id ? { ...t, completed: !t.completed } : t
          );
        case "delete":
          return state.filter((t) => t.id !== action.payload.id);
        case "create":
          return [action.payload.task, ...state];
        case "update":
          return state.map((t) =>
            t.id === action.payload.id ? { ...t, ...action.payload.data } : t
          );
        default:
          return state;
      }
    }
  );

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
  const filteredTasks = useMemo(
    () =>
      showCompleted
        ? optimisticTasks
        : optimisticTasks.filter((t) => !t.completed),
    [optimisticTasks, showCompleted]
  );

  // Group tasks
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const inSevenDays = addDays(today, 7);

    const groups: Record<string, Task[]> = {
      Overdue: [],
      Today: [],
      Tomorrow: [],
      "This Week": [],
      Upcoming: [],
      "No Date": [],
    };

    filteredTasks.forEach((task) => {
      if (!task.dueDate) {
        groups["No Date"].push(task);
        return;
      }

      const dueDate = new Date(task.dueDate);

      if (!task.completed && isPast(dueDate) && !isToday(dueDate)) {
        groups["Overdue"].push(task);
      } else if (isToday(dueDate)) {
        groups["Today"].push(task);
      } else if (isTomorrow(dueDate)) {
        groups["Tomorrow"].push(task);
      } else if (dueDate <= inSevenDays) {
        groups["This Week"].push(task);
      } else {
        groups["Upcoming"].push(task);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([, tasks]) => tasks.length > 0)
    );
  }, [filteredTasks]);

  // Get overdue count
  const overdueCount = useMemo(
    () =>
      optimisticTasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
      ).length,
    [optimisticTasks]
  );

  // Get completed count
  const completedCount = useMemo(
    () => optimisticTasks.filter((t) => t.completed).length,
    [optimisticTasks]
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
    startTransition(async () => {
      addOptimisticTaskAction({ type: "toggle", payload: { id } });
      try {
        const updated = await toggleTaskComplete(id);
        if (updated) {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }
      } catch {
        showToast("Failed to toggle task");
      }
    });
  }, [addOptimisticTaskAction, showToast]);

  const handleDeleteTask = useCallback((id: string) => {
    startTransition(async () => {
      addOptimisticTaskAction({ type: "delete", payload: { id } });
      try {
        await deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch {
        showToast("Failed to delete task");
      }
    });
  }, [addOptimisticTaskAction, showToast]);

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
            {filteredTasks.length === 0 ? (
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
              Object.entries(groupedTasks).map(([title, tasks]) => (
                <TaskGroup
                  key={title}
                  title={title}
                  tasks={tasks}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onToggleSubtask={handleToggleSubtask}
                  userId="default"
                  selectedTaskIds={selectedTaskIds}
                  onSelectTask={handleSelectTask}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedTaskIds.size}
        onClearSelection={handleClearSelection}
        onToggleComplete={handleBulkToggleComplete}
        onDelete={handleBulkDelete}
      />

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
