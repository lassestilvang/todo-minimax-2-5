"use client";

import React, { useState, useEffect, memo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  currentListId?: string;
  currentView?: string;
}

function SidebarComponent({
  lists,
  labels,
  overdueCount,
  currentListId,
  currentView = "all",
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    lists: true,
    views: true,
    labels: true,
  });
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let activeTheme: "light" | "dark" = "dark";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      activeTheme = stored;
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      activeTheme = isSystemDark ? "dark" : "light";
    }

    setTimeout(() => {
      setTheme(activeTheme);
      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
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
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 transition-transform duration-200 hover:rotate-12"
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
          )}
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
          <button
            onClick={() => toggleSection("lists")}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <span>Lists</span>
            <motion.div
              initial={false}
              animate={{ rotate: expandedSections.lists ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
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
                            <Inbox className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
                          ) : (
                            <span
                              className="h-3 w-3 rounded-full flex-shrink-0 transition-transform duration-150 group-hover:scale-110"
                              style={{ backgroundColor: list.color || "#6b7280" }}
                            />
                          )}
                          <span className="truncate">{list.emoji}</span>
                          <span className="truncate">{list.name}</span>
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
          <button
            onClick={() => toggleSection("labels")}
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <span>Labels</span>
            <motion.div
              initial={false}
              animate={{ rotate: expandedSections.labels ? 0 : -90 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </button>
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
                    {labels.map((label, index) => (
                      <motion.div
                        key={label.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link
                          href={`/?label=${label.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-150 group"
                          onClick={() => setIsOpen(false)}
                        >
                          <Tag
                            className="h-4 w-4 transition-transform duration-150 group-hover:scale-110"
                            style={{ color: label.color || "#6b7280" }}
                          />
                          <span className="truncate">{label.emoji}</span>
                          <span className="truncate">{label.name}</span>
                        </Link>
                      </motion.div>
                    ))}
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
      <div className="p-4 border-t border-border dark:border-zinc-800/50">
        <p className="text-xs text-muted-foreground/60 text-center font-medium">
          TaskFlow © {new Date().getFullYear()}
        </p>
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
    </>
  );
}

export const Sidebar = memo(SidebarComponent);