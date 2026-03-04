"use client";

import React, { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { Task } from "@/types";

interface SearchBarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function SearchBar({ tasks, onSelectTask }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 5);
  }, [query, fuse]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search tasks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
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
          {results.map(({ item: task }) => (
            <button
              key={task.id}
              onClick={() => {
                onSelectTask(task);
                setQuery("");
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left"
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
