import { describe, test, expect } from "bun:test";
import { cn } from "./utils";
import { PRIORITY_COLORS, LIST_COLORS, type Priority, type RecurringType, type ViewType } from "@/types";

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
    const priorities: Priority[] = ["HIGH", "MEDIUM", "LOW", "NONE"];
    expect(priorities.length).toBe(4);
  });

  test("should export RecurringType type", () => {
    const types: RecurringType[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"];
    expect(types.length).toBe(5);
  });

  test("should export ViewType type", () => {
    const views: ViewType[] = ["today", "week", "upcoming", "all"];
    expect(views.length).toBe(4);
  });
});

describe("Priority Colors Tests", () => {
  test("should have correct priority colors", () => {
    expect(PRIORITY_COLORS.HIGH).toBe("#ef4444");
    expect(PRIORITY_COLORS.MEDIUM).toBe("#f59e0b");
    expect(PRIORITY_COLORS.LOW).toBe("#22c55e");
    expect(PRIORITY_COLORS.NONE).toBe("#6b7280");
  });
});

describe("List Colors Tests", () => {
  test("should have valid list colors", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    LIST_COLORS.forEach((color) => {
      expect(hexRegex.test(color)).toBe(true);
    });

    expect(LIST_COLORS.length).toBe(12);
  });
});
