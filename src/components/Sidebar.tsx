"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Calendar,
  ChevronRight,
  ChevronDown,
  Plus,
  Tag,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { List, Label } from "@/types";

interface SidebarProps {
  lists: List[];
  labels: Label[];
  overdueCount: number;
  currentListId?: string;
  currentView?: string;
}

export function Sidebar({
  lists,
  labels,
  overdueCount,
  currentListId,
  currentView = "all",
}: SidebarProps) {
  const pathname = usePathname();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    lists: true,
    views: true,
    labels: true,
  });
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark");

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const views = [
    { id: "today", label: "Today", icon: Calendar, href: "/?view=today" },
    { id: "week", label: "Next 7 Days", icon: Calendar, href: "/?view=week" },
    { id: "upcoming", label: "Upcoming", icon: Calendar, href: "/?view=upcoming" },
    { id: "all", label: "All Tasks", icon: Inbox, href: "/?view=all" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-card dark:bg-[#1a1a1a] border-r border-border dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border dark:border-zinc-800">
        <h1 className="text-xl font-bold">TaskFlow</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Views Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection("views")}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Views</span>
            {expandedSections.views ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {expandedSections.views && (
            <div className="mt-1 space-y-1 animate-fade-in">
              {views.map((view) => {
                const isActive = currentView === view.id;
                return (
                  <Link
                    key={view.id}
                    href={view.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <view.icon className="h-4 w-4" />
                    <span>{view.label}</span>
                    {view.id === "today" && overdueCount > 0 && (
                      <span className="ml-auto overdue-badge">{overdueCount}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Lists Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection("lists")}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Lists</span>
            <div className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              {expandedSections.lists ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>
          {expandedSections.lists && (
            <div className="mt-1 space-y-1 animate-fade-in">
              {lists.map((list) => {
                const isActive = currentListId === list.id;
                return (
                  <Link
                    key={list.id}
                    href={`/?list=${list.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: list.color || "#6b7280" }}
                    />
                    <span>{list.emoji}</span>
                    <span className="truncate">{list.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Labels Section */}
        <div className="mb-4">
          <button
            onClick={() => toggleSection("labels")}
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Labels</span>
            <div className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              {expandedSections.labels ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>
          {expandedSections.labels && labels.length > 0 && (
            <div className="mt-1 space-y-1 animate-fade-in">
              {labels.map((label) => (
                <Link
                  key={label.id}
                  href={`/?label=${label.id}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Tag className="h-4 w-4" style={{ color: label.color || "#6b7280" }} />
                  <span>{label.emoji}</span>
                  <span className="truncate">{label.name}</span>
                </Link>
              ))}
            </div>
          )}
          {expandedSections.labels && labels.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No labels yet</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border dark:border-zinc-800">
        <p className="text-xs text-muted-foreground text-center">
          TaskFlow &copy; {new Date().getFullYear()}
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
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block md:w-72 flex-shrink-0">{sidebarContent}</div>
    </>
  );
}
