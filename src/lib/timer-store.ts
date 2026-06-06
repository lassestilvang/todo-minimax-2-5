const TIMER_STORAGE_KEY = "active-timers";
const TIMER_EVENT_NAME = "timer-store-update";
const TIMER_TICK_EVENT = "timer-tick";

let globalIntervalId: ReturnType<typeof setInterval> | null = null;
let tickListenerCount = 0;

export interface TimerData {
  taskId: string;
  taskTitle?: string;
  userId: string;
  startTime: number;
  elapsed: number;
}

function createTickEvent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TIMER_TICK_EVENT));
}

function startGlobalTicker() {
  if (globalIntervalId !== null) return;
  globalIntervalId = setInterval(createTickEvent, 1000);
}

function stopGlobalTicker() {
  if (globalIntervalId === null) return;
  clearInterval(globalIntervalId);
  globalIntervalId = null;
}

export function subscribeToTimers(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  tickListenerCount++;
  startGlobalTicker();
  window.addEventListener(TIMER_TICK_EVENT, callback);
  return () => {
    window.removeEventListener(TIMER_TICK_EVENT, callback);
    tickListenerCount--;
    if (tickListenerCount <= 0) {
      tickListenerCount = 0;
      stopGlobalTicker();
    }
  };
}

let cachedTimers: TimerData[] | null = null;

export function getActiveTimers(): TimerData[] {
  if (typeof window === "undefined") return [];
  if (cachedTimers !== null) return cachedTimers;
  try {
    const data = localStorage.getItem(TIMER_STORAGE_KEY);
    cachedTimers = data ? JSON.parse(data) : [];
    return cachedTimers!;
  } catch {
    cachedTimers = [];
    return cachedTimers;
  }
}

export function saveActiveTimers(timers: TimerData[]): void {
  if (typeof window === "undefined") return;
  cachedTimers = timers;
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timers));
}

export function addActiveTimer(timer: TimerData): void {
  const timers = getActiveTimers();
  timers.push(timer);
  saveActiveTimers(timers);
  broadcastTimersChange();
}

export function removeActiveTimer(taskId: string): void {
  let timers = getActiveTimers();
  timers = timers.filter((t) => t.taskId !== taskId);
  saveActiveTimers(timers);
  broadcastTimersChange();
}

export function updateActiveTimer(taskId: string, updates: Partial<TimerData>): void {
  let timers = getActiveTimers();
  timers = timers.map((t) => (t.taskId === taskId ? { ...t, ...updates } : t));
  saveActiveTimers(timers);
  broadcastTimersChange();
}

export function clearAllTimers(): void {
  saveActiveTimers([]);
  broadcastTimersChange();
}

export function broadcastTimersChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TIMER_EVENT_NAME));
  createTickEvent();
}

export function getElapsedSeconds(timer: TimerData): number {
  if (!timer || typeof timer.startTime !== "number") return 0;
  return (timer.elapsed || 0) + Math.floor((Date.now() - timer.startTime) / 1000);
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatDurationShort(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}