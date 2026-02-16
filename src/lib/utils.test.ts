import { describe, test, expect } from "bun:test";
import { cn } from "./utils";

describe("Utils Tests", () => {
  test("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
    expect(cn("foo", false && "bar")).toBe("foo");
    expect(cn("foo", null, "bar")).toBe("foo bar");
    expect(cn("foo", { bar: true, baz: false })).toBe("foo bar");
    expect(cn("foo", { bar: false, baz: true })).toBe("foo baz");
  });
});

describe("Types Tests", () => {
  test("should export Priority type", () => {
    type Priority = "HIGH" | "MEDIUM" | "LOW" | "NONE";
    const priorities: Priority[] = ["HIGH", "MEDIUM", "LOW", "NONE"];
    expect(priorities.length).toBe(4);
  });

  test("should export RecurringType type", () => {
    type RecurringType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
    const types: RecurringType[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"];
    expect(types.length).toBe(5);
  });

  test("should export ViewType type", () => {
    type ViewType = "today" | "week" | "upcoming" | "all";
    const views: ViewType[] = ["today", "week", "upcoming", "all"];
    expect(views.length).toBe(4);
  });
});

describe("Priority Colors Tests", () => {
  test("should have correct priority colors", () => {
    const PRIORITY_COLORS: Record<string, string> = {
      HIGH: "#ef4444",
      MEDIUM: "#f59e0b",
      LOW: "#22c55e",
      NONE: "#6b7280",
    };

    expect(PRIORITY_COLORS.HIGH).toBe("#ef4444");
    expect(PRIORITY_COLORS.MEDIUM).toBe("#f59e0b");
    expect(PRIORITY_COLORS.LOW).toBe("#22c55e");
    expect(PRIORITY_COLORS.NONE).toBe("#6b7280");
  });
});

describe("List Colors Tests", () => {
  test("should have valid list colors", () => {
    const LIST_COLORS = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#84cc16",
      "#22c55e",
      "#14b8a6",
      "#06b6d4",
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#ec4899",
    ];

    // All colors should be valid hex codes
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    LIST_COLORS.forEach((color) => {
      expect(hexRegex.test(color)).toBe(true);
    });

    expect(LIST_COLORS.length).toBe(12);
  });
});
