"use client";

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Plus, Calendar, Flag, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PRIORITY_COLORS } from "@/types";
import type { Priority, List, TaskFormData } from "@/types";
import { format, addDays, nextDay, getDay, startOfDay } from "date-fns";

interface QuickAddBarProps {
  lists: List[];
  onSubmit: (data: TaskFormData) => void;
}

export interface QuickAddBarHandle {
  open: () => void;
}

const QUICK_DATES = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next Week", days: 7 },
];

const DAYS_MAP: Record<string, number> = {
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
  sun: 0, sunday: 0,
};

export const QuickAddBar = forwardRef<QuickAddBarHandle, QuickAddBarProps>(
  function QuickAddBar({ lists, onSubmit }, ref) {
    const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
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

  useImperativeHandle(ref, () => ({
    open() {
      setIsExpanded(true);
    },
  }));

  // NLP Parser
  useEffect(() => {
    let currentTitle = inputValue;
    let priority: Priority = "NONE";
    let dueDate: Date | null = null;
    let listId: string = "";

    // Parse Priority: !high, !medium, !low, !none or !h, !m, !l, !n
    const priorityMatch = currentTitle.match(/!(high|medium|low|none|h|m|l|n)\b/i);
    if (priorityMatch) {
      const p = priorityMatch[1].toLowerCase();
      if (p === "high" || p === "h") priority = "HIGH";
      else if (p === "medium" || p === "m") priority = "MEDIUM";
      else if (p === "low" || p === "l") priority = "LOW";
      else if (p === "none" || p === "n") priority = "NONE";
      currentTitle = currentTitle.replace(priorityMatch[0], "");
    }

    // Parse List: #listname (only if title starts with it or it's at the end)
    const listMatch = currentTitle.match(/#(\w+)\b/i);
    if (listMatch) {
      const listName = listMatch[1].toLowerCase();
      const matchedList = lists.find(l => l.name.toLowerCase().includes(listName));
      if (matchedList) {
        listId = matchedList.id;
        currentTitle = currentTitle.replace(listMatch[0], "");
      }
    }

    // Parse Dates
    const today = startOfDay(new Date());
    
    // Today/Tomorrow
    if (/\b(today)\b/i.test(currentTitle)) {
      dueDate = today;
      currentTitle = currentTitle.replace(/\b(today)\b/i, "");
    } else if (/\b(tomorrow)\b/i.test(currentTitle)) {
      dueDate = addDays(today, 1);
      currentTitle = currentTitle.replace(/\b(tomorrow)\b/i, "");
    } else if (/\b(next week)\b/i.test(currentTitle)) {
      dueDate = addDays(today, 7);
      currentTitle = currentTitle.replace(/\b(next week)\b/i, "");
    } else {
      // Days of week
      for (const [dayStr, dayNum] of Object.entries(DAYS_MAP)) {
        const regex = new RegExp(`\\b(${dayStr})\\b`, "i");
        if (regex.test(currentTitle)) {
          const targetDay = dayNum as any;
          dueDate = nextDay(today, targetDay);
          currentTitle = currentTitle.replace(regex, "");
          break;
        }
      }
    }

    setTitle(currentTitle.trim());
    setSelectedPriority(priority);
    setSelectedListId(listId);
    setSelectedDate(dueDate);
  }, [inputValue, lists]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const finalTitle = title.trim();
    if (!finalTitle) return;

    onSubmit({
      title: finalTitle,
      priority: selectedPriority,
      listId: selectedListId === "" ? undefined : selectedListId,
      dueDate: selectedDate || undefined,
    });

    setInputValue("");
    setIsExpanded(false);
  }, [title, selectedPriority, selectedListId, selectedDate, onSubmit]);

  const handleCancel = useCallback(() => {
    setInputValue("");
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
        <div className="ml-auto hidden sm:flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-medium text-muted-foreground">Try "tomorrow !high #work"</span>
          <kbd className="h-5 items-center rounded border border-border/50 bg-muted/50 px-1.5 text-[10px] text-muted-foreground font-medium">
            ↵
          </kbd>
        </div>
      </motion.button>
    );
  }

  const matchedList = lists.find(l => l.id === selectedListId);

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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleCancel();
            }
          }}
          placeholder="What needs to be done? (e.g. Buy milk tomorrow !high)"
          className="border-0 bg-transparent px-0 h-auto text-base font-medium placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
          maxLength={200}
        />

        <AnimatePresence>
          {inputValue && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-border/50"
            >
              {/* Parsed Priority */}
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors",
                selectedPriority !== "NONE" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
              )}>
                <Flag
                  className="h-3 w-3"
                  style={{ color: selectedPriority !== "NONE" ? PRIORITY_COLORS[selectedPriority] : undefined }}
                />
                {selectedPriority === "NONE" ? "No Priority" : selectedPriority}
              </div>

              {/* Parsed Date */}
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors",
                selectedDate ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
              )}>
                <Calendar className="h-3 w-3" />
                {selectedDate ? format(selectedDate, "MMM d") : "No Date"}
              </div>

              {/* Parsed List */}
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors",
                selectedListId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/60"
              )}>
                {matchedList ? (
                  <>
                    <span className="text-xs">{matchedList.emoji}</span>
                    <span>{matchedList.name}</span>
                  </>
                ) : (
                  <>
                    <Inbox className="h-3 w-3" />
                    <span>Inbox</span>
                  </>
                )}
              </div>

              {/* Parsed Title Preview */}
              <div className="flex-1 min-w-[100px] mx-2">
                <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-widest block mb-0.5">Title Preview</span>
                <span className="text-sm font-medium text-foreground/70 truncate block">
                  {title || "..."}
                </span>
              </div>

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
                  className="px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  );
});

