"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  getElapsedSeconds,
  formatDurationShort,
  type TimerData,
} from "@/lib/timer-store";
import { useTimer, useActiveTimersStore } from "@/hooks/use-timer";

interface ActiveTimersIndicatorProps {
  userId: string;
  onFocusTask?: (taskId: string) => void;
}

export function ActiveTimersIndicator({ userId, onFocusTask }: ActiveTimersIndicatorProps) {
  const timers = useActiveTimersStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const originalTitle = useRef("");

  useEffect(() => {
    originalTitle.current = document.title;
  }, []);

  // Update page title with elapsed time when timers are active
  useEffect(() => {
    if (timers.length === 0) {
      document.title = originalTitle.current;
      return;
    }

    const totalElapsed = timers.reduce((sum, t) => sum + getElapsedSeconds(t), 0);
    document.title = `[${formatDurationShort(totalElapsed)}] ${originalTitle.current}`;
  }, [timers]);

  const totalActive = timers.length;

  if (totalActive === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex flex-col items-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full shadow-lg h-10 px-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2 relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">{totalActive} active timer{totalActive > 1 ? "s" : ""}</span>
          </div>
        </Button>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-80 space-y-2 rounded-2xl border bg-background/95 backdrop-blur-md p-4 shadow-2xl"
          >
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Active Sessions</h4>
            <div className="space-y-2">
              {timers.map((timer) => (
                <TimerControl
                  key={timer.taskId}
                  timer={timer}
                  userId={userId}
                  onFocus={() => {
                    onFocusTask?.(timer.taskId);
                    setIsExpanded(false);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface TimerControlProps {
  timer: TimerData;
  userId: string;
  onFocus?: () => void;
}

function TimerControl({ timer, userId, onFocus }: TimerControlProps) {
  const { isRunning, elapsed, start, stop, pause } = useTimer(
    timer.taskId,
    userId,
    timer.taskTitle
  );

  return (
    <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 transition-all hover:border-primary/30">
      <div className="flex flex-col flex-1 min-w-0 mr-2">
        <span className="text-sm font-bold truncate">
          {timer.taskTitle || `Task ${timer.taskId.slice(0, 8)}...`}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono font-bold">
          {formatDurationShort(elapsed)}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10"
          onClick={onFocus}
          title="Focus mode"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        {isRunning ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={pause}
            title="Pause"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-500"
            onClick={start}
            title="Resume"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => stop()}
          title="Stop and save"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
