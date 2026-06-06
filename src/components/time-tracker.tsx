"use client";

import React, { useCallback } from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimer } from "@/hooks/use-timer";

interface TimeTrackerProps {
  taskId: string;
  taskTitle?: string;
  userId: string;
  onTimerStop?: (elapsedSeconds: number) => void;
  className?: string;
  compact?: boolean;
}

export function TimeTracker({
  taskId,
  taskTitle,
  userId,
  onTimerStop,
  className,
  compact = false,
}: TimeTrackerProps) {
  const { isRunning, formattedTime, start, stop, pause } = useTimer(taskId, userId, taskTitle);

  const handleToggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  const handleStop = useCallback(() => {
    const elapsed = stop();
    onTimerStop?.(elapsed);
  }, [stop, onTimerStop]);

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-xs font-mono text-muted-foreground">
          {formattedTime}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleToggle}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
        <span className="text-lg font-mono tabular-nums text-foreground">
          {formattedTime}
        </span>
      </div>
      <div className="flex gap-2">
        {isRunning ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pause}
              className="gap-1.5"
              aria-label="Pause timer"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleStop}
              className="gap-1.5"
              aria-label="Stop and save time"
            >
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggle}
              className="gap-1.5"
              aria-label="Resume timer"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="gap-1.5 text-muted-foreground"
              aria-label="Discard and stop timer"
            >
              <Square className="h-4 w-4" />
              Discard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
