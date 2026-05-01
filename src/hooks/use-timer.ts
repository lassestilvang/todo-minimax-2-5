"use client";

import { useEffect, useCallback, useState } from "react";
import {
  getActiveTimers,
  addActiveTimer,
  removeActiveTimer,
  updateActiveTimer,
  getElapsedSeconds,
  formatDuration,
  formatDurationShort,
  type TimerData,
} from "@/lib/timer-store";

export function useTimer(taskId: string, userId: string) {
  const [isRunning, setIsRunning] = useState(() => {
    if (typeof window === "undefined") return false;
    const timers = getActiveTimers();
    return timers.some((t) => t.taskId === taskId);
  });
  const [elapsed, setElapsed] = useState(() => {
    if (typeof window === "undefined") return 0;
    const timers = getActiveTimers();
    const existingTimer = timers.find((t) => t.taskId === taskId);
    return existingTimer ? getElapsedSeconds(existingTimer) : 0;
  });

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => {
    const timers = getActiveTimers();
    const existing = timers.find((t) => t.taskId === taskId);
    if (existing) {
      updateActiveTimer(taskId, { startTime: Date.now() });
    } else {
      const newTimer: TimerData = {
        taskId,
        userId,
        startTime: Date.now(),
        elapsed: 0,
      };
      addActiveTimer(newTimer);
    }
    setIsRunning(true);
    setElapsed(0);
  }, [taskId, userId]);

  const stop = useCallback((): number => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return elapsed;

    const finalElapsed = getElapsedSeconds(timer);
    removeActiveTimer(taskId);
    setIsRunning(false);
    setElapsed(0);
    return finalElapsed;
  }, [taskId, elapsed]);

  const pause = useCallback(() => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return;

    const elapsedSeconds = getElapsedSeconds(timer);
    updateActiveTimer(taskId, {
      startTime: Date.now(),
      elapsed: timer.elapsed + elapsedSeconds,
    });
    setIsRunning(false);
  }, [taskId]);

  const resume = useCallback(() => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return;

    updateActiveTimer(taskId, { startTime: Date.now() });
    setIsRunning(true);
  }, [taskId]);

  const reset = useCallback(() => {
    removeActiveTimer(taskId);
    setIsRunning(false);
    setElapsed(0);
  }, [taskId]);

  return {
    isRunning,
    elapsed,
    formattedTime: formatDuration(elapsed),
    formattedShort: formatDurationShort(elapsed),
    start,
    stop,
    pause,
    resume,
    reset,
  };
}
