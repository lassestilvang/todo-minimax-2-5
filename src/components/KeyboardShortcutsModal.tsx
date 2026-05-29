"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard, Search, Sparkles, X, CornerDownLeft } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "General Actions",
    shortcuts: [
      { keys: ["Ctrl", "N"], description: "Create a new task" },
      { keys: ["Esc"], description: "Close modals, form overlays, or cancel editing" },
    ],
  },
  {
    title: "Navigation & Search",
    shortcuts: [
      { keys: ["/"], description: "Focus search bar globally" },
      { keys: ["?"], description: "Toggle this keyboard shortcuts helper" },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md bg-card dark:bg-[#141415] border border-border dark:border-zinc-800/80 shadow-2xl p-6 rounded-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Keyboard className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground/80 text-sm">
            Supercharge your productivity with global hotkeys.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/30 border border-accent/20 hover:border-accent/40 transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground/80">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          {i > 0 && <span className="text-[10px] text-muted-foreground/40 font-bold">+</span>}
                          <kbd className="inline-flex items-center justify-center px-2 py-1 min-w-[24px] text-xs font-semibold font-mono text-foreground bg-accent border border-border rounded-md shadow-[0_2px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_2px_0_0_rgba(255,255,255,0.05)]">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-between items-center text-[11px] text-muted-foreground/60 border-t border-border/50 pt-4">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
            <span>Anti-gravity power tips loaded.</span>
          </div>
          <span>Press <kbd className="font-mono bg-accent px-1 rounded">?</kbd> to close.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
