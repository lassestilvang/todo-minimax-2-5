"use client";

import React from "react";
import { Check, Trash2, X, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  onToggleComplete,
  onDelete,
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
