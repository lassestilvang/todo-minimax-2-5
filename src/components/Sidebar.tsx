"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  ListTodo,
  ChevronRight,
  ChevronDown,
  Tag,
  Sun,
  Moon,
  Menu,
  X,
  Inbox,
  Settings2,
  Keyboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ListManagerDialog, LabelManagerDialog } from "@/components/ManagerDialogs";
import type { List, Label } from "@/types";

const VIEWS = [
  { id: "today", label: "Today", icon: CalendarDays, href: "/?view=today" },
  { id: "week", label: "Next 7 Days", icon: Calendar, href: "/?view=week" },
  { id: "upcoming", label: "Upcoming", icon: Calendar, href: "/?view=upcoming" },
  { id: "all", label: "All Tasks", icon: ListTodo, href: "/?view=all" },
];

interface SidebarProps {
  lists: List[];
  labels: Label[];
  overdueCount: number;
  doneTodayCount?: number;
  labelCounts?: Record<string, number>;
  viewCounts?: Record<string, number>;
  currentListId?: string;
  currentLabelId?: string;
  currentView?: string;
  onOpenShortcuts?: () => void;
}

function SidebarComponent({
  lists,
  labels,
  overdueCount,
  doneTodayCount = 0,
  labelCounts,
  viewCounts,
  currentListId,
  currentLabelId,
  currentView = "all",
  onOpenShortcuts,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    lists: true,
    views: true,
    labels: true,
  });
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "dark";
    try {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark ? "dark" : "light";
    } catch {
      return "dark";
    }
  });
  const [listManagerOpen, setListManagerOpen] = useState(false);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", newTheme === "dark" ? "#141415" : "#ffffff");
    }
  }, [theme]);

  // Listen for system theme changes when no explicit theme is set
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      setTheme(newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };



  const sidebarContent = (
    <div className="flex flex-col h-full bg-card dark:bg-[#141415] border-r border-border dark:border-zinc-800/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-zinc-800/50">
        <motion.h1
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tight font-[family-name:var(--font-heading)]"
        >
          TaskFlow
        </motion.h1>
        <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 transition-transform duration-200 hover:rotate-12"
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
            <motion.div
              initial={false}
              animate={{ rotate: theme === "dark" ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </motion.div>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Views Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection("views")}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <span>Views</span>
            <motion.div
              initial={false}
              animate={{ rotate: expandedSections.views ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>
          <AnimatePresence>
            {expandedSections.views && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-0.5">
                  {VIEWS.map((view, index) => {
                    const isActive = currentView === view.id;
                    const viewCount = viewCounts?.[view.id];
                    return (
                      <motion.div
                        key={view.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link
                          key={view.id}
                          href={view.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 group",
                            isActive
                              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          <view.icon className={cn(
                            "h-4 w-4 transition-transform duration-150 group-hover:scale-110",
                            isActive && "scale-110"
                          )} />
                          <span>{view.label}</span>
                          {viewCount !== undefined && !(view.id === "today" && overdueCount > 0) && (
                            <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono tabular-nums">
                              {viewCount}
                            </span>
                          )}
                          {view.id === "today" && overdueCount > 0 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-bold rounded-full bg-red-500 text-white"
                            >
                              {overdueCount > 9 ? "9+" : overdueCount}
                            </motion.span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lists Section */}
        <div className="mb-4">
          <div className="flex items-center pr-1">
            <button
              onClick={() => toggleSection("lists")}
              className="flex-1 flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <span>Lists</span>
              <motion.div
                initial={false}
                animate={{ rotate: expandedSections.lists ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="ml-2"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </button>
            <button
              onClick={() => setListManagerOpen(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Manage lists"
              title="Manage lists"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <AnimatePresence>
            {expandedSections.lists && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-1 space-y-0.5">
                  {lists.map((list, index) => {
                    const isActive = currentListId === list.id;
                    const isInbox = list.name.toLowerCase() === "inbox";
                    const totalTasks = list.tasks?.length || 0;
                    const completedTasks = list.tasks?.filter((t) => t.completed).length || 0;
                    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <motion.div
                        key={list.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link
                          href={`/?list=${list.id}`}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 group",
                            isActive
                              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {isInbox ? (
                            <Inbox className="h-4 w-4 transition-transform duration-150 group-hover:scale-110 flex-shrink-0" />
                          ) : (
                            <span
                              className="h-3 w-3 rounded-full flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                              style={{ backgroundColor: list.color || "#6b7280" }}
                            />
                          )}
                          {list.emoji && <span className="flex-shrink-0">{list.emoji}</span>}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{list.name}</span>
                              {totalTasks > 0 && (
                                <span className="text-[10px] text-muted-foreground/70 font-semibold font-mono tabular-nums">
                                  {completedTasks}/{totalTasks}
                                </span>
                              )}
                            </div>
                            {totalTasks > 0 && (
                              <div className="mt-1 h-1 w-full bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.4, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: list.color || "#3b82f6" }}
                                />
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Labels Section */}
        <div className="mb-4">
          <div className="flex items-center pr-1">
            <button
              onClick={() => toggleSection("labels")}
              className="flex-1 flex items-center px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <span>Labels</span>
              <motion.div
                initial={false}
                animate={{ rotate: expandedSections.labels ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="ml-2"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </button>
            <button
              onClick={() => setLabelManagerOpen(true)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Manage labels"
              title="Manage labels"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <AnimatePresence>
            {expandedSections.labels && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                {labels.length > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    {labels.map((label, index) => {
                      const isActive = currentLabelId === label.id;
                      const labelCount = labelCounts?.[label.id];
                      return (
                        <motion.div
                          key={label.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Link
                            href={`/?label=${label.id}`}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 group",
                              isActive
                                ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            onClick={() => setIsOpen(false)}
                          >
                            <Tag
                              className="h-4 w-4 transition-transform duration-150 group-hover:scale-110"
                              style={{ color: label.color || "#6b7280" }}
                            />
                            <span className="truncate">{label.emoji}</span>
                            <span className="truncate">{label.name}</span>
                            {labelCount !== undefined && labelCount > 0 && (
                              <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono tabular-nums">
                                {labelCount}
                              </span>
                            )}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-3 text-sm text-muted-foreground/60 italic">
                    No labels yet
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border dark:border-zinc-800/50 space-y-4">
        {doneTodayCount > 0 && (
          <div className="px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Done today</span>
              <span className="text-xs font-bold text-green-600 dark:text-green-400 font-mono">{doneTodayCount}</span>
            </div>
            <div className="h-1 w-full bg-green-500/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((doneTodayCount / 5) * 100, 100)}%` }}
                className="h-full bg-green-500"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={onOpenShortcuts}
          >
            <Keyboard className="h-3.5 w-3.5 mr-2" />
            Shortcuts
          </Button>
          <p className="text-[10px] text-muted-foreground/40 font-medium">
            TaskFlow v1.0
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 bg-background/80 backdrop-blur-sm border border-border shadow-sm"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
      >
        {sidebarContent}
      </motion.div>

      {/* Desktop sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="hidden md:block md:w-72 flex-shrink-0"
      >
        {sidebarContent}
      </motion.div>

      <ListManagerDialog
        isOpen={listManagerOpen}
        onClose={() => setListManagerOpen(false)}
        lists={lists}
      />
      <LabelManagerDialog
        isOpen={labelManagerOpen}
        onClose={() => setLabelManagerOpen(false)}
        labels={labels}
      />
    </>
  );
}

export const Sidebar = memo(SidebarComponent);