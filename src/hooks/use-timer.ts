"use client";

import { useEffect, useCallback, useState, useSyncExternalStore } from "react";
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

const TIMER_EVENT_NAME = "timer-store-update";

function subscribe(callback: () => void) {
  window.addEventListener(TIMER_EVENT_NAME, callback);
  return () => window.removeEventListener(TIMER_EVENT_NAME, callback);
}

function getServerSnapshot() {
  return [];
}

export function useActiveTimersStore() {
  return useSyncExternalStore(subscribe, getActiveTimers, getServerSnapshot);
}

export function useTimer(taskId: string, userId: string) {
  const timers = useActiveTimersStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timers.some((t) => t.taskId === taskId)) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [taskId, timers]);

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
        userId,
        startTime: Date.now(),
        elapsed: 0,
      };
      addActiveTimer(newTimer);
    }
  }, [taskId, userId]);

  const stop = useCallback((): number => {
    const timers = getActiveTimers();
    const timer = timers.find((t) => t.taskId === taskId);
    if (!timer) return elapsed;

    const finalElapsed = getElapsedSeconds(timer);
    removeActiveTimer(taskId);
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
