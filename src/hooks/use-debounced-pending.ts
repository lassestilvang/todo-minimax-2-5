"use client";

import { useRef, useCallback, useEffect, useState } from "react";

interface DebouncedPendingState {
  [key: string]: boolean;
}

export function useDebouncedPending() {
  const [pending, setPending] = useState<DebouncedPendingState>({});
  const timeoutsRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const setPendingAction = useCallback((id: string, debounceMs = 300) => {
    setPending((prev) => ({ ...prev, [id]: true }));

    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
    }

    timeoutsRef.current[id] = setTimeout(() => {
      setPending((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      delete timeoutsRef.current[id];
    }, debounceMs);
  }, []);

  const clearPending = useCallback((id: string) => {
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    setPending((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return { pending, setPendingAction, clearPending };
}

export function useRequestDedup() {
  const pendingRef = useRef<Set<string>>(new Set());

  const isPending = useCallback((key: string) => {
    return pendingRef.current.has(key);
  }, []);

  const startRequest = useCallback((key: string) => {
    if (pendingRef.current.has(key)) {
      return false;
    }
    pendingRef.current.add(key);
    return true;
  }, []);

  const endRequest = useCallback((key: string) => {
    pendingRef.current.delete(key);
  }, []);

  return { isPending, startRequest, endRequest };
}