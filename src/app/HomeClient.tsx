"use client";

import React, { useState, useTransition, useMemo, useCallback, useOptimistic } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Plus, Eye, EyeOff } from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { TaskGroup } from "@/components/TaskGroup";
import { BulkActionToolbar } from "@/components/BulkActionToolbar";
import { TaskForm } from "@/components/TaskForm";
import { SearchBar } from "@/components/SearchBar";
import { ViewToggle } from "@/components/ViewToggle";
import { EmptyState } from "@/components/EmptyState";
import { QuickAddBar } from "@/components/QuickAddBar";
import { ActiveTimersIndicator } from "@/components/active-timers";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import type { Task, List, Label, TaskFormData, ViewType } from "@/types";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  toggleSubtaskComplete,
  clearCompletedTasks,
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

  // Get URL params first so they're available to handlers below
  const currentView = (searchParams.get("view") as ViewType) || "all";
  const currentListId = searchParams.get("list") || undefined;
  const currentLabelId = searchParams.get("label") || undefined;

  const [optimisticTasks, addOptimisticTaskAction] = useOptimistic(
    tasks,
    (
      state: Task[],
      action: { type: "toggle" | "delete" | "create" | "update"; payload: unknown }
    ) => {
      switch (action.type) {
        case "toggle": {
          const { id } = action.payload as { id: string };
          return state.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          );
        }
        case "delete": {
          const { id } = action.payload as { id: string };
          return state.filter((t) => t.id !== id);
        }
        case "create": {
          const { task } = action.payload as { task: Task };
          return [task, ...state];
        }
        case "update": {
          const { id, data } = action.payload as { id: string; data: Partial<Task> };
          return state.map((t) => (t.id === id ? { ...t, ...data } : t));
        }
        default:
          return state;
      }
    }
  );

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

  useKeyboardShortcuts([
    { key: "n", ctrl: true, action: () => setIsTaskFormOpen(true) },
    { key: "Escape", action: () => {
      if (selectedTaskIds.size > 0) {
        handleClearSelection();
      } else {
        setIsTaskFormOpen(false);
        setEditingTask(null);
        setIsShortcutsOpen(false);
      }
    }},
    { key: "?", action: () => setIsShortcutsOpen((prev) => !prev) },
    { key: "h", ctrl: true, action: () => setShowCompleted((prev) => !prev) },
    { key: "d", action: () => {
      if (selectedTaskIds.size > 0) {
        handleBulkDelete();
      }
    }},
    { key: "a", ctrl: true, action: () => {
      const allIds = filteredTasksRef.current.map(t => t.id);
      setSelectedTaskIds(new Set(allIds));
    }},
  ]);

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

  // Keep ref in sync with filtered tasks so the Ctrl+A shortcut can read
  // the latest visible tasks without re-creating the shortcut handler.
  const filteredTasksRef = React.useRef(filteredTasks);
  React.useEffect(() => {
    filteredTasksRef.current = filteredTasks;
  }, [filteredTasks]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
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

  const totalFilteredCount = useMemo(() => filteredTasks.length, [filteredTasks]);
  const completionPercentage = useMemo(() => {
    const total = filteredTasks.length;
    if (total === 0) return 0;
    const currentCompleted = filteredTasks.filter((t) => t.completed).length;
    return (currentCompleted / total) * 100;
  }, [filteredTasks]);

  // Handlers
  const handleCreateTask = useCallback((data: TaskFormData) => {
    const tempId = `temp-${crypto.randomUUID()}`;
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

  const handleClearCompleted = useCallback(() => {
    const doneCount = optimisticTasks.filter((t) => t.completed).length;
    if (doneCount === 0) return;
    if (!confirm(`Clear all ${doneCount} completed task${doneCount !== 1 ? "s" : ""}?`)) return;

    startTransition(async () => {
      try {
        await clearCompletedTasks();
        setTasks((prev) => prev.filter((t) => !t.completed));
      } catch {
        showToast("Failed to clear completed tasks");
      }
    });
  }, [optimisticTasks, showToast]);

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
    // Find the parent task first so we can do a targeted update
    let parentTaskId: string | undefined;
    setTasks((prev) => {
      for (const task of prev) {
        if (task.subtasks?.some((st) => st.id === subtaskId)) {
          parentTaskId = task.id;
          break;
        }
      }
      // Optimistic toggle
      return prev.map((task) => {
        if (task.id !== parentTaskId) return task;
        const subtasks = task.subtasks?.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...task, subtasks };
      });
    });

    startTransition(async () => {
      try {
        const updatedSubtask = await toggleSubtaskComplete(subtaskId);
        if (updatedSubtask && parentTaskId) {
          // Targeted update: only update the affected subtask in the parent task
          setTasks((prev) =>
            prev.map((task) => {
              if (task.id !== parentTaskId) return task;
              const subtasks = task.subtasks?.map((st) =>
                st.id === subtaskId ? { ...st, completed: updatedSubtask.completed } : st
              );
              return { ...task, subtasks };
            })
          );
        }
      } catch {
        // Revert toggle subtask on error
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id !== parentTaskId) return task;
            const subtasks = task.subtasks?.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );
            return { ...task, subtasks };
          })
        );
        showToast("Failed to toggle subtask");
      }
    });
  }, [showToast]);

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
                <div className="flex items-center gap-3 mt-1">
                  {currentView !== "all" && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                  {totalFilteredCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Progress value={completionPercentage} className="h-1.5 w-24" />
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {Math.round(completionPercentage)}% done
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/50 bg-muted/80 px-1.5 text-[10px] text-muted-foreground font-medium">
                  <span>⌘N</span>
                </kbd>
                <Button onClick={() => setIsTaskFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
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
              <>
                <Badge variant="secondary">
                  {completedCount} completed
                </Badge>
                <button
                  onClick={handleClearCompleted}
                  className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors ml-1"
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          {/* Stats Summary */}
          {filteredTasks.length > 0 && (
            <div className="flex items-center gap-4 mb-4 px-1 py-2 text-xs text-muted-foreground/70 border-b border-border/30">
              <span className="font-medium text-foreground/80">
                {totalFilteredCount} task{totalFilteredCount !== 1 ? "s" : ""}
              </span>
              {completedCount > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-green-600 dark:text-green-400">
                    {completedCount} done
                  </span>
                </>
              )}
              {overdueCount > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-red-500 font-medium">
                    {overdueCount} overdue
                  </span>
                </>
              )}
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>
                {Math.round(completionPercentage)}% complete
              </span>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <EmptyState
                viewType={currentView}
                hasList={!!currentListId}
                hasLabel={!!currentLabelId}
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

          {/* Quick Add */}
          <div className="mt-3">
            <QuickAddBar
              lists={lists}
              onSubmit={handleCreateTask}
            />
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
