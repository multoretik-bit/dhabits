import { describe, expect, it } from "vitest";
import { formatCalendarDays, formatUsefulTime, getUsefulTimeStats } from "./usefulTime";

describe("getUsefulTimeStats", () => {
  it("counts all calendar days from 1 August including days without sessions", () => {
    const stats = getUsefulTimeStats([
      { date: "2026-08-01", durationSeconds: 2 * 3600 },
      { date: "2026-08-03", durationSeconds: 3600 },
      { date: "2026-07-31", durationSeconds: 10 * 3600 },
    ], "2026-08-03");

    expect(stats).toEqual({ totalSeconds: 3 * 3600, daysElapsed: 3, averageSecondsPerDay: 3600 });
  });

  it("does not count future sessions", () => {
    const stats = getUsefulTimeStats([
      { date: "2026-08-02", durationSeconds: 1800 },
      { date: "2026-08-04", durationSeconds: 7200 },
    ], "2026-08-02");

    expect(stats.totalSeconds).toBe(1800);
    expect(stats.daysElapsed).toBe(2);
  });
});

describe("formatUsefulTime", () => {
  it("formats hours and minutes", () => {
    expect(formatUsefulTime(5 * 3600 + 32 * 60)).toBe("5 ч 32 мин");
  });

  it("formats the number of calendar days", () => {
    expect(formatCalendarDays(31)).toBe("31 календарный день");
    expect(formatCalendarDays(22)).toBe("22 календарных дня");
    expect(formatCalendarDays(15)).toBe("15 календарных дней");
  });
});
