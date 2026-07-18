import { describe, expect, it } from "vitest";
import { getCurrentBlock, isHabitScheduledForDay } from "./schedule";

const blocks = [
  { id: "morning", startTime: "09:00", endTime: "10:00" },
  { id: "work", startTime: "16:00", endTime: "18:00" },
  { id: "night", startTime: "23:00", endTime: "01:00" },
];

function at(hours: number, minutes: number) {
  const date = new Date(2026, 6, 17, hours, minutes);
  return getCurrentBlock(blocks, date)?.id ?? null;
}

describe("getCurrentBlock", () => {
  it("switches to a block exactly at its start", () => expect(at(16, 0)).toBe("work"));
  it("keeps the block active until its end", () => expect(at(17, 59)).toBe("work"));
  it("stops the block exactly at its end", () => expect(at(18, 0)).toBeNull());
  it("supports blocks that cross midnight", () => {
    expect(at(23, 30)).toBe("night");
    expect(at(0, 30)).toBe("night");
  });
});

describe("isHabitScheduledForDay", () => {
  it("shows a habit only on an explicitly selected weekday", () => {
    const habit = { daysOfWeek: [1, 3, 5] };
    expect(isHabitScheduledForDay(habit, 3)).toBe(true);
    expect(isHabitScheduledForDay(habit, 4)).toBe(false);
  });

  it("does not treat an empty or missing schedule as every day", () => {
    expect(isHabitScheduledForDay({ daysOfWeek: [] }, 6)).toBe(false);
    expect(isHabitScheduledForDay({}, 6)).toBe(false);
  });

  it("supports weekday values saved by older versions as strings", () => {
    expect(isHabitScheduledForDay({ daysOfWeek: ["0", "2"] }, 2)).toBe(true);
  });
});
