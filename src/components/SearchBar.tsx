"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import type { Task } from "@/types";

interface SearchBarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function SearchBar({ tasks, onSelectTask }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const resultsRef = useRef<FuseResult<Task>[]>([]);
  const selectedIndexRef = useRef(-1);
  const isOpenRef = useRef(false);

  const debouncedQuery = useDebounce(query, 150);

  const fuse = useMemo(
    () =>
      new Fuse(tasks, {
        keys: ["title", "description", "labels.name"],
        threshold: 0.3,
        includeScore: true,
      }),
    [tasks]
  );

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return fuse.search(debouncedQuery).slice(0, 5);
  }, [debouncedQuery, fuse]);

  useEffect(() => {
    resultsRef.current = results;
    selectedIndexRef.current = selectedIndex;
    isOpenRef.current = isOpen;
  }, [results, selectedIndex, isOpen]);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpenRef.current) {
      setIsOpen(false);
      setQuery("");
      setSelectedIndex(-1);
      return;
    }

    if (!isOpenRef.current || resultsRef.current.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < resultsRef.current.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : resultsRef.current.length - 1));
    } else if (e.key === "Enter" && selectedIndexRef.current >= 0) {
      e.preventDefault();
      const task = resultsRef.current[selectedIndexRef.current].item;
      onSelectTask(task);
      setQuery("");
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  }, [onSelectTask]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div className="relative" ref={containerRef}>
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors duration-150" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "pl-11 pr-20 h-11 bg-muted/50 dark:bg-muted/30 border-transparent transition-all duration-200",
            isFocused && "bg-background dark:bg-background border-primary/30 shadow-sm"
          )}
        />
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query === "" && (
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border/50 bg-muted/80 px-2 text-xs text-muted-foreground font-medium">
              <span>/</span>
            </kbd>
          )}
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Search Results */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border bg-popover dark:bg-[#1a1a1a] p-1.5 shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden"
          >
            {results.map(({ item: task }, index) => (
              <motion.button
                key={task.id}
                initial={false}
                animate={{
                  backgroundColor: index === selectedIndex
                    ? "var(--color-accent)"
                    : "transparent",
                }}
                transition={{ duration: 0.1 }}
                onClick={() => {
                  onSelectTask(task);
                  setQuery("");
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                  index === selectedIndex
                    ? "text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex-1 truncate font-medium",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </span>
                {task.labels && task.labels.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {task.labels.map((l) => l.emoji).join(" ")}
                  </span>
                )}
                {index === selectedIndex && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results */}
      <AnimatePresence>
        {isOpen && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full rounded-xl border bg-popover dark:bg-[#1a1a1a] p-6 shadow-xl shadow-black/5 dark:shadow-black/20"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No tasks found for <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Try searching with different keywords
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}