const TIMER_STORAGE_KEY = "active-timers";
const TIMER_EVENT_NAME = "timer-store-update";

export interface TimerData {
  taskId: string;
  userId: string;
  startTime: number; // timestamp
  elapsed: number; // seconds already accumulated (for pause/resume)
}

export function getActiveTimers(): TimerData[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(TIMER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveActiveTimers(timers: TimerData[]): void {
  if (typeof window === "undefined") return;
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
}

export function getElapsedSeconds(timer: TimerData): number {
  if (!timer || typeof timer.startTime !== "number") return 0;
  return (timer.elapsed || 0) + (Date.now() - timer.startTime);
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
