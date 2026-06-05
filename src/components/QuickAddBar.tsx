"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Calendar, Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PRIORITY_COLORS } from "@/types";
import type { Priority, List, TaskFormData } from "@/types";
import { format, addDays } from "date-fns";

interface QuickAddBarProps {
  lists: List[];
  onSubmit: (data: TaskFormData) => void;
}

const QUICK_DATES = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next Week", days: 7 },
];

export function QuickAddBar({ lists, onSubmit }: QuickAddBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("NONE");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    onSubmit({
      title: trimmed,
      priority: selectedPriority,
      listId: selectedListId === "" ? undefined : selectedListId,
      dueDate: selectedDate || undefined,
    });

    setTitle("");
    setSelectedPriority("NONE");
    setSelectedDate(null);
    setIsExpanded(false);
  }, [title, selectedPriority, selectedListId, selectedDate, onSubmit]);

  const handleCancel = useCallback(() => {
    setTitle("");
    setSelectedPriority("NONE");
    setSelectedDate(null);
    setIsExpanded(false);
  }, []);

  if (!isExpanded) {
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all duration-200 group cursor-text"
      >
        <Plus className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        <span className="text-sm text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
          Quick add task...
        </span>
        <kbd className="ml-auto hidden sm:inline-flex h-5 items-center rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] text-muted-foreground/50 font-medium">
          ↵
        </kbd>
      </motion.button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onSubmit={handleSubmit}
      className="rounded-xl border border-border/80 bg-card dark:bg-[#1a1a1a] shadow-lg shadow-black/5 overflow-hidden"
    >
      <div className="p-3">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCancel();
            }
          }}
          placeholder="What needs to be done?"
          className="border-0 bg-transparent px-0 h-auto text-base font-medium placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          maxLength={200}
        />

        <AnimatePresence>
          {title && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-border/50"
            >
              {/* Priority */}
              <div className="flex items-center gap-1">
                {(["HIGH", "MEDIUM", "LOW", "NONE"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPriority(p)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all",
                      selectedPriority === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Flag
                      className="h-3 w-3"
                      style={{ color: p !== "NONE" ? PRIORITY_COLORS[p] : undefined }}
                    />
                  </button>
                ))}
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-1">
                {QUICK_DATES.map((qd) => (
                  <button
                    key={qd.label}
                    type="button"
                    onClick={() => {
                      const date = addDays(new Date(), qd.days);
                      date.setHours(0, 0, 0, 0);
                      setSelectedDate(
                        selectedDate?.getTime() === date.getTime() ? null : date
                      );
                    }}
                    className={cn(
                      "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all",
                      selectedDate &&
                        format(selectedDate, "yyyy-MM-dd") ===
                          format(addDays(new Date(), qd.days), "yyyy-MM-dd")
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {qd.label}
                  </button>
                ))}
              </div>

              {/* List */}
              {lists.length > 0 && (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="h-7 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-muted text-muted-foreground border-0 px-2 cursor-pointer hover:bg-accent transition-colors"
                >
                  <option value="">Inbox</option>
                  {lists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.emoji} {list.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Actions */}
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  );
}
