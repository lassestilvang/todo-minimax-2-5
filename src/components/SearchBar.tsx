"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Fuse, { type FuseResult } from "fuse.js";
import { Search, X } from "lucide-react";
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md animate-fade-in">
          {results.map(({ item: task }, index) => (
            <button
              key={task.id}
              onClick={() => {
                onSelectTask(task);
                setQuery("");
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm text-left",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span
                className={cn(
                  "flex-1 truncate",
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
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-4 shadow-md animate-fade-in">
          <p className="text-sm text-muted-foreground text-center">
            No tasks found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
