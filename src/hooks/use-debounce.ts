import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delay < 0) return;
    const handler = setTimeout(() => setDebouncedValue(value), Math.max(0, delay));
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}