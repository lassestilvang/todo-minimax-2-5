"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Timer, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Task, Subtask } from "@/types";
import { useTimer } from "@/hooks/use-timer";

interface FocusModeProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (id: string) => void;
  userId?: string;
}

export function FocusMode({
  task,
  isOpen,
  onClose,
  onToggleComplete,
  onToggleSubtask,
  userId = "default",
}: FocusModeProps) {
  const { isRunning, elapsed, formattedTime, start, pause } = useTimer(
    task.id,
    userId,
    task.title
  );

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Prevent scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
        >
          {/* Ambient Background */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/30 to-violet-500/30 blur-[120px]"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-blue-500/30 to-emerald-500/30 blur-[120px]"
            />
          </div>

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Focus Mode</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted/50 transition-all"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="w-full max-w-3xl px-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-[family-name:var(--font-heading)] leading-tight">
                {task.title}
              </h2>
              {task.description && (
                <p className="text-lg text-muted-foreground max-w-xl mx-auto line-clamp-2">
                  {task.description}
                </p>
              )}
            </motion.div>

            {/* Timer Display */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="relative mb-16"
            >
              <div className="relative z-10">
                <span className="text-8xl md:text-[10rem] font-bold font-mono tabular-nums tracking-tight">
                  {formattedTime}
                </span>
              </div>
              
              {/* Animated Progress Ring (simplified as a background pulse) */}
              <motion.div
                animate={{
                  scale: isRunning ? [1, 1.05, 1] : 1,
                  opacity: isRunning ? [0.3, 0.5, 0.3] : 0.3,
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 -m-8 rounded-full border-4 border-primary/20 -z-10"
              />
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 mb-16"
            >
              <Button
                size="lg"
                onClick={isRunning ? pause : start}
                className="h-16 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                {isRunning ? "Pause Session" : "Start Session"}
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  onToggleComplete(task.id);
                  onClose();
                }}
                className="h-16 px-8 rounded-2xl text-lg font-bold border-2 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50 transition-all"
              >
                <CheckCircle2 className="h-6 w-6 mr-2" />
                Mark as Done
              </Button>
            </motion.div>

            {/* Subtasks Section */}
            {totalSubtasks > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-md bg-muted/30 dark:bg-muted/10 rounded-3xl p-6 border border-border/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-left">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Progress</h4>
                    <p className="text-lg font-bold">{completedSubtasks} of {totalSubtasks} steps done</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">{Math.round(progress)}%</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-muted rounded-full mb-8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                  />
                </div>

                <div className="space-y-3 text-left max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {task.subtasks?.map((subtask) => (
                    <div
                      key={subtask.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all",
                        subtask.completed ? "bg-muted/50 opacity-60" : "bg-background/50 hover:bg-background shadow-sm"
                      )}
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => onToggleSubtask(subtask.id)}
                        className="h-5 w-5 rounded-md"
                      />
                      <span className={cn(
                        "text-sm font-medium",
                        subtask.completed && "line-through"
                      )}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-12 flex items-center gap-8 text-muted-foreground/60">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">Session Active</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm font-medium">ESC to exit</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
