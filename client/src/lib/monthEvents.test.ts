import { describe, expect, it } from "vitest";
import type { MonthEvent } from "@/contexts/AppContext";
import { getMonthEventOccurrenceForDate, monthEventCoversDate, timeFallsWithinBlock } from "./monthEvents";

const event: MonthEvent = {
  id: "event-1",
  startDate: "2026-08-03",
  title: "Тренировка",
  color: "#315cff",
  duration: 1,
  time: "18:30",
};

describe("month events", () => {
  it("repeats an event every week", () => {
    const weekly = { ...event, recurrence: "weekly" as const };
    expect(monthEventCoversDate(weekly, "2026-08-10")).toBe(true);
    expect(monthEventCoversDate(weekly, "2026-08-11")).toBe(false);
    expect(getMonthEventOccurrenceForDate(weekly, "2026-08-17")?.occurrenceStartDate).toBe("2026-08-17");
  });

  it("respects multi-day duration and repeat end date", () => {
    const weekly = { ...event, duration: 2, recurrence: "weekly" as const, repeatUntil: "2026-08-17" };
    expect(monthEventCoversDate(weekly, "2026-08-18")).toBe(true);
    expect(monthEventCoversDate(weekly, "2026-08-24")).toBe(false);
  });

  it("places timed events inside normal and overnight blocks", () => {
    expect(timeFallsWithinBlock("10:30", "09:00", "12:00")).toBe(true);
    expect(timeFallsWithinBlock("13:00", "09:00", "12:00")).toBe(false);
    expect(timeFallsWithinBlock("00:30", "22:00", "02:00")).toBe(true);
  });
});
