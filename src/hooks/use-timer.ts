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
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds

  useEffect(() => {
    const timers = getActiveTimers();
    const existingTimer = timers.find((t) => t.taskId === taskId);
    if (existingTimer) {
      setIsRunning(true);
      setElapsed(getElapsedSeconds(existingTimer));
    }
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
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
