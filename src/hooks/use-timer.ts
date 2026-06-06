"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getActiveTimers,
  addActiveTimer,
  removeActiveTimer,
  updateActiveTimer,
  subscribeToTimers,
  getElapsedSeconds,
  formatDuration,
  formatDurationShort,
  type TimerData,
} from "@/lib/timer-store";

const EMPTY_ARRAY: TimerData[] = [];

function getServerSnapshot() {
  return EMPTY_ARRAY;
}

export function useActiveTimersStore() {
  return useSyncExternalStore(subscribeToTimers, getActiveTimers, getServerSnapshot);
}

export function useTimer(taskId: string, userId: string, taskTitle?: string) {
  const timers = useActiveTimersStore();

  const isRunning = timers.some((t) => t.taskId === taskId);
  const existingTimer = timers.find((t) => t.taskId === taskId);
  const elapsed = existingTimer ? getElapsedSeconds(existingTimer) : 0;

  const start = useCallback(() => {
    const timers = getActiveTimers();
    const existing = timers.find((t) => t.taskId === taskId);
    if (existing) {
      updateActiveTimer(taskId, { startTime: Date.now() });
    } else {
      const newTimer: TimerData = {
        taskId,
        taskTitle,
        userId,
        startTime: Date.now(),
        elapsed: 0,
      };
      addActiveTimer(newTimer);
    }
  }, [taskId, userId, taskTitle]);

  const stop = useCallback((): number => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return 0;

    const finalElapsed = getElapsedSeconds(timer);
    removeActiveTimer(taskId);
    return finalElapsed;
  }, [taskId]);

  const pause = useCallback(() => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return;

    const elapsedSeconds = getElapsedSeconds(timer);
    updateActiveTimer(taskId, {
      startTime: Date.now(),
      elapsed: timer.elapsed + elapsedSeconds,
    });
  }, [taskId]);

  const resume = useCallback(() => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return;

    updateActiveTimer(taskId, { startTime: Date.now() });
  }, [taskId]);

  const reset = useCallback(() => {
    removeActiveTimer(taskId);
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