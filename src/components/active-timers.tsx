"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getElapsedSeconds,
  formatDurationShort,
  type TimerData,
} from "@/lib/timer-store";
import { useTimer, useActiveTimersStore } from "@/hooks/use-timer";

interface ActiveTimersIndicatorProps {
  userId: string;
}

export function ActiveTimersIndicator({ userId }: ActiveTimersIndicatorProps) {
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
          className="rounded-full shadow-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <span>{totalActive} active timer{totalActive > 1 ? "s" : ""}</span>
          </div>
        </Button>

        {isExpanded && (
          <div className="w-80 space-y-2 rounded-lg border bg-background p-4 shadow-lg">
            <h4 className="font-medium">Active Timers</h4>
            <div className="space-y-2">
              {timers.map((timer) => (
                <TimerControl
                  key={timer.taskId}
                  timer={timer}
                  userId={userId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TimerControlProps {
  timer: TimerData;
  userId: string;
}

function TimerControl({ timer, userId }: TimerControlProps) {
  const { isRunning, elapsed, start, stop, pause } = useTimer(
    timer.taskId,
    userId
  );

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          Task {timer.taskId.slice(0, 8)}...
        </span>
        <span className="text-xs text-muted-foreground font-mono">
          {formatDurationShort(elapsed)}
        </span>
      </div>
      <div className="flex gap-1">
        {isRunning ? (
          <Button
            type="button"
            variant="outline"
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
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={start}
            title="Resume"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={() => stop()}
          title="Stop and save"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
