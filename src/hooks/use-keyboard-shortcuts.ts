"use client";

import { useEffect, useRef, useCallback } from "react";

type ModifierKey = "ctrl" | "shift" | "alt" | "meta";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
}

function getModifierState(event: KeyboardEvent): Record<ModifierKey, boolean> {
  return {
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey,
  };
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable
    ) {
      return;
    }

    const modifiers = getModifierState(event);

    for (const shortcut of shortcutsRef.current) {
      const ctrlMatch = shortcut.ctrl ? modifiers.ctrl : !modifiers.ctrl;
      const shiftMatch = shortcut.shift ? modifiers.shift : !modifiers.shift;
      const altMatch = shortcut.alt ? modifiers.alt : !modifiers.alt;
      const metaMatch = shortcut.meta !== undefined
        ? (shortcut.meta ? modifiers.meta : !modifiers.meta)
        : true;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}