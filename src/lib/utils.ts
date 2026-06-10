import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { addDays, addWeeks, addMonths, addYears, nextDay, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseCustomRecurring(text: string) {
  const lowerText = text.toLowerCase();
  let interval = 1;
  let unit: "day" | "week" | "month" | "year" | "weekday" | "weekend" | null = null;
  let dayOfWeek: number | null = null; // 0 for Sunday, 6 for Saturday

  // "every X days/weeks/months/years"
  const everyMatch = lowerText.match(/every\s+(\d+)\s+(day|week|month|year)s?/);
  if (everyMatch) {
    interval = parseInt(everyMatch[1]);
    unit = everyMatch[2] as any;
  } else if (lowerText.includes("every day")) {
    unit = "day";
  } else if (lowerText.includes("every week")) {
    unit = "week";
  } else if (lowerText.includes("every month")) {
    unit = "month";
  } else if (lowerText.includes("every year")) {
    unit = "year";
  }

  // "every monday/tuesday"
  const dayMatch = lowerText.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (dayMatch) {
    unit = "weekday";
    dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayMatch[1]);
  }

  // "every weekday" or "every weekend"
  if (lowerText.includes("every weekday")) {
    unit = "weekday";
  } else if (lowerText.includes("every weekend")) {
    unit = "weekend";
  }

  if (unit) {
    return { interval, unit, dayOfWeek };
  }
  return null;
}

export function getNextRecurrenceDate(
  currentDueDate: Date,
  recurringType: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM",
  recurringCustom: string | null
): Date {
  let nextDate = startOfDay(currentDueDate); // Start from the beginning of the current due date

  switch (recurringType) {
    case "DAILY":
      nextDate = addDays(nextDate, 1);
      break;
    case "WEEKLY":
      nextDate = addWeeks(nextDate, 1);
      break;
    case "MONTHLY":
      nextDate = addMonths(nextDate, 1);
      break;
    case "YEARLY":
      nextDate = addYears(nextDate, 1);
      break;
    case "CUSTOM":
      if (recurringCustom) {
        const parsed = parseCustomRecurring(recurringCustom);
        if (parsed) {
          if (parsed.unit === "day") {
            nextDate = addDays(nextDate, parsed.interval);
          } else if (parsed.unit === "week") {
            nextDate = addWeeks(nextDate, parsed.interval);
          } else if (parsed.unit === "month") {
            nextDate = addMonths(nextDate, parsed.interval);
          } else if (parsed.unit === "year") {
            nextDate = addYears(nextDate, parsed.interval);
          } else if (parsed.unit === "weekday" && parsed.dayOfWeek !== null) {
            nextDate = nextDay(nextDate, parsed.dayOfWeek);
            // If the next day is the same as current, move to next week
            if (nextDate.getTime() === startOfDay(currentDueDate).getTime()) {
              nextDate = addWeeks(nextDay(nextDate, parsed.dayOfWeek), 1);
            }
          } else if (parsed.unit === "weekday") {
            // Find next weekday (Mon-Fri)
            do {
              nextDate = addDays(nextDate, 1);
            } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // Skip Sunday (0) and Saturday (6)
          } else if (parsed.unit === "weekend") {
            // Find next weekend day (Sat-Sun)
            do {
              nextDate = addDays(nextDate, 1);
            } while (nextDate.getDay() !== 0 && nextDate.getDay() !== 6);
          }
        } else {
          // Fallback for unparseable custom: treat as daily
          nextDate = addDays(nextDate, 1);
        }
      } else {
        // If custom is selected but no custom text, treat as daily
        nextDate = addDays(nextDate, 1);
      }
      break;
    default:
      // Should not happen, but as a fallback
      nextDate = addDays(nextDate, 1);
  }
  return nextDate;
}
