"use client";

import React, { useState } from "react";
import { Check, Trash2, X, Flag, List, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PRIORITY_COLORS } from "@/types";
import type { Priority, List as ListType } from "@/types";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onBatchUpdate: (data: { priority?: string; listId?: string | null }) => void;
  lists: ListType[];
}

const PRIORITIES: Priority[] = ["HIGH", "MEDIUM", "LOW", "NONE"];

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onToggleComplete,
  onDelete,
  onBatchUpdate,
  lists,
}: BulkActionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-2xl bg-background border border-border shadow-2xl"
        >
          <div className="flex items-center gap-3 pr-4 border-r border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold whitespace-nowrap">
                {selectedCount} tasks selected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BatchPrioritySelect onSelect={(p) => onBatchUpdate({ priority: p })} />
            <BatchListSelect lists={lists} onSelect={(listId) => onBatchUpdate({ listId })} />
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2"
              onClick={onToggleComplete}
            >
              <Check className="h-4 w-4" />
              Mark Done
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BatchPrioritySelect({ onSelect }: { onSelect: (priority: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 text-xs font-semibold uppercase tracking-wider rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
      >
        <Flag className="h-3.5 w-3.5" />
        Priority
        <ChevronDown className="h-3 w-3" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 min-w-[140px] rounded-xl border bg-popover dark:bg-[#1a1a1a] p-1.5 shadow-lg"
          >
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => {
                  onSelect(p);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Flag
                  className="h-3.5 w-3.5"
                  style={{ color: p !== "NONE" ? PRIORITY_COLORS[p] : undefined }}
                />
                {p === "NONE" ? "No priority" : p.toLowerCase()}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BatchListSelect({ lists, onSelect }: { lists: ListType[]; onSelect: (listId: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-9 px-3 text-xs font-semibold uppercase tracking-wider rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-colors"
      >
        <List className="h-3.5 w-3.5" />
        List
        <ChevronDown className="h-3 w-3" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 min-w-[160px] rounded-xl border bg-popover dark:bg-[#1a1a1a] p-1.5 shadow-lg"
          >
            <button
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-accent transition-colors text-left text-muted-foreground"
            >
              No list
            </button>
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => {
                  onSelect(list.id);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-accent transition-colors text-left"
              >
                {list.emoji} {list.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
