import { describe, expect, it } from "vitest";
import { applyDayScheduleOverride, getCurrentBlock, getScheduleRestGaps, isHabitScheduledForDay } from "./schedule";

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

describe("applyDayScheduleOverride", () => {
  it("returns the blocks unchanged when there is no override for the day", () => {
    expect(applyDayScheduleOverride(blocks, undefined)).toEqual(blocks);
  });

  it("drops blocks hidden for that day", () => {
    const result = applyDayScheduleOverride(blocks, { hidden: ["work"] });
    expect(result.map((b) => b.id)).toEqual(["morning", "night"]);
  });

  it("applies a per-day start/end time override without touching the original block", () => {
    const result = applyDayScheduleOverride(blocks, { times: { work: { startTime: "17:00" } } });
    expect(result.find((b) => b.id === "work")).toMatchObject({ startTime: "17:00", endTime: "18:00" });
    expect(blocks.find((b) => b.id === "work")!.startTime).toBe("16:00");
  });

  it("reorders blocks per the saved order and appends unlisted blocks at the end", () => {
    const result = applyDayScheduleOverride(blocks, { order: ["night", "morning"] });
    expect(result.map((b) => b.id)).toEqual(["night", "morning", "work"]);
  });

  it("combines hiding, retiming and reordering together", () => {
    const result = applyDayScheduleOverride(blocks, {
      hidden: ["morning"],
      times: { night: { endTime: "02:00" } },
      order: ["night", "work"],
    });
    expect(result).toEqual([
      { id: "night", startTime: "23:00", endTime: "02:00" },
      { id: "work", startTime: "16:00", endTime: "18:00" },
    ]);
  });
});

describe("getScheduleRestGaps", () => {
  it("fills the entire day around scheduled blocks", () => {
    expect(getScheduleRestGaps([
      { startTime: "09:00", endTime: "10:00" },
      { startTime: "16:00", endTime: "18:00" },
    ])).toEqual([
      { start: 0, end: 540, duration: 540 },
      { start: 600, end: 960, duration: 360 },
      { start: 1080, end: 1440, duration: 360 },
    ]);
  });

  it("merges overlaps and supports blocks crossing midnight", () => {
    expect(getScheduleRestGaps([
      { startTime: "23:00", endTime: "01:00" },
      { startTime: "00:30", endTime: "02:00" },
      { startTime: "10:00", endTime: "12:00" },
      { startTime: "11:00", endTime: "13:00" },
    ])).toEqual([
      { start: 120, end: 600, duration: 480 },
      { start: 780, end: 1380, duration: 600 },
    ]);
  });

  it("splits a free interval at standalone event times", () => {
    expect(getScheduleRestGaps([{ startTime: "10:00", endTime: "12:00" }], ["08:30", "15:00"]))
      .toEqual([
        { start: 0, end: 510, duration: 510 },
        { start: 510, end: 600, duration: 90 },
        { start: 720, end: 900, duration: 180 },
        { start: 900, end: 1440, duration: 540 },
      ]);
  });

  it("returns one full-day rest interval without scheduled blocks", () => {
    expect(getScheduleRestGaps([])).toEqual([{ start: 0, end: 1440, duration: 1440 }]);
  });
});
