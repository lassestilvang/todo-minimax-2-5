"use client";

import React, { useState, useEffect, useTransition, Suspense, useMemo, useCallback } from "react";
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
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import type { Task, List, Label, TaskFormData, ViewType } from "@/types";
import {
  getLists,
  getLabels,
  getTasks,
  getOrCreateInbox,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  toggleSubtaskComplete,
} from "./actions";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();
  const [showCompleted, setShowCompleted] = useState(true);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useKeyboardShortcuts([
    { key: "n", ctrl: true, action: () => setIsTaskFormOpen(true) },
    { key: "Escape", action: () => { setIsTaskFormOpen(false); setEditingTask(null); } },
  ]);

  // Get params
  const currentView = (searchParams.get("view") as ViewType) || "all";
  const currentListId = searchParams.get("list") || undefined;

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [listsData, labelsData, tasksResult] = await Promise.all([
          getLists(),
          getLabels(),
          getTasks(currentView, currentListId),
        ]);
        
        // Ensure inbox exists
        const inbox = await getOrCreateInbox();
        if (!listsData.find((l) => l.id === inbox.id)) {
          listsData.unshift(inbox);
        }
        
        setLists(listsData);
        setLabels(labelsData);
        setTasks(Array.isArray(tasksResult) ? tasksResult : tasksResult.tasks);
      } catch {
        showToast("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [currentView, currentListId, showToast]);

  // Get current list
  const currentList = lists.find((l) => l.id === currentListId);

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
    startTransition(async () => {
      try {
        const newTask = await createTask(data);
        setTasks((prev) => [newTask, ...prev]);
      } catch {
        showToast("Failed to create task");
      }
    });
  }, [showToast]);

  const handleUpdateTask = useCallback((data: TaskFormData) => {
    if (!editingTask) return;
    startTransition(async () => {
      try {
        const updated = await updateTask(editingTask.id, data);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(null);
      } catch {
        showToast("Failed to update task");
      }
    });
  }, [editingTask, showToast]);

  const handleToggleComplete = useCallback((id: string) => {
    setPendingAction(id);
    startTransition(async () => {
      try {
        const updated = await toggleTaskComplete(id);
        if (updated) {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        }
      } catch {
        showToast("Failed to toggle task");
      } finally {
        setPendingAction(null);
      }
    });
  }, [showToast]);

  const handleDeleteTask = useCallback((id: string) => {
    setPendingAction(id);
    startTransition(async () => {
      try {
        await deleteTask(id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } catch {
        showToast("Failed to delete task");
      } finally {
        setPendingAction(null);
      }
    });
  }, [showToast]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    startTransition(async () => {
      try {
        await toggleSubtaskComplete(subtaskId);
        const result = await getTasks(currentView, currentListId);
        setTasks(Array.isArray(result) ? result : result.tasks);
      } catch {
        showToast("Failed to toggle subtask");
      }
    });
  }, [currentView, currentListId, showToast]);

  const handleSelectTaskFromSearch = useCallback((task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const pageTitle = useMemo(() => {
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
  }, [currentList, currentView]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        lists={lists}
        labels={labels}
        overdueCount={overdueCount}
        currentListId={currentListId}
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
                visibleTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskCard
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                      onToggleSubtask={handleToggleSubtask}
                      userId="default"
                      isLoading={pendingAction === task.id}
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
    </div>
  );
}
