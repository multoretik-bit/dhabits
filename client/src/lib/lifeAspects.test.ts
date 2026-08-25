import { describe, expect, it } from "vitest";
import { getTimerActivityAspectId, getTimerMinutesForAspectInYear, getTimerMinutesForAspectOnDate, getTimerMinutesForAspectPartsOnDate } from "./lifeAspects";

describe("getTimerActivityAspectId", () => {
  it.each(["Английский", "История России", "Чтение книги"])("routes %s to study", (title) => {
    expect(getTimerActivityAspectId(title, "#67e8f9")).toBe("10");
  });

  it.each(["Спорт", "Хождение пешком", "Силовые", "Силовая тренировка"])("routes %s to health", (title) => {
    expect(getTimerActivityAspectId(title, "#ffd814")).toBe("2");
  });

  it("routes any work activity to business and work", () => {
    expect(getTimerActivityAspectId("Работа над проектом", "#ffd814")).toBe("8");
  });

  it("uses the aspect color when the title has no special rule", () => {
    expect(getTimerActivityAspectId("Медитация", "#5d0794")).toBe("7");
  });

  it("keeps legacy yellow sessions in study", () => {
    expect(getTimerActivityAspectId("Конспект", "#facc15")).toBe("10");
  });

  it("sums only today's sessions for the selected aspect", () => {
    const sessions = [
      { date: "2026-08-23", title: "Английский", color: "#ffd814", durationSeconds: 30 * 60 },
      { date: "2026-08-23", title: "История", color: "#ffd814", durationSeconds: 45 * 60 },
      { date: "2026-08-22", title: "Чтение", color: "#ffd814", durationSeconds: 60 * 60 },
      { date: "2026-08-23", title: "Работа", color: "#ffd814", durationSeconds: 20 * 60 },
    ];
    expect(getTimerMinutesForAspectOnDate(sessions, "10", "2026-08-23")).toBe(75);
  });

  it("sums an aspect across the selected calendar year", () => {
    const sessions = [
      { date: "2026-01-10", title: "Спорт", color: "#2815ff", durationSeconds: 20 * 60 },
      { date: "2026-08-23", title: "Хождение", color: "#2815ff", durationSeconds: 35 * 60 },
      { date: "2026-08-25", title: "Силовые", color: "#ffd814", durationSeconds: 40 * 60 },
      { date: "2025-12-31", title: "Спорт", color: "#2815ff", durationSeconds: 50 * 60 },
    ];
    expect(getTimerMinutesForAspectInYear(sessions, "2", 2026)).toBe(95);
  });

  it("splits an aspect into independently filled daily parts", () => {
    const sessions = [
      { date: "2026-08-23", title: "История России", color: "#ffd814", durationSeconds: 25 * 60 },
      { date: "2026-08-23", title: "Английский слова", color: "#ffd814", durationSeconds: 40 * 60 },
      { date: "2026-08-23", title: "Чтение книги", color: "#ffd814", durationSeconds: 15 * 60 },
      { date: "2026-08-23", title: "Конспект", color: "#ffd814", durationSeconds: 50 * 60 },
    ];
    const parts = [
      { id: "history", name: "История", targetMinutes: 30 },
      { id: "english", name: "Английский", targetMinutes: 40 },
      { id: "reading", name: "Чтение", targetMinutes: 20 },
    ];

    expect(getTimerMinutesForAspectPartsOnDate(sessions, "10", "2026-08-23", parts)).toEqual([
      { ...parts[0], actualMinutes: 25 },
      { ...parts[1], actualMinutes: 40 },
      { ...parts[2], actualMinutes: 15 },
    ]);
  });

  it("counts only the configured sport part", () => {
    const sessions = [
      { date: "2026-08-25", title: "Хождение пешком", color: "#2815ff", durationSeconds: 35 * 60 },
      { date: "2026-08-25", title: "Силовые", color: "#2815ff", durationSeconds: 40 * 60 },
      { date: "2026-08-25", title: "Спорт", color: "#2815ff", durationSeconds: 20 * 60 },
    ];
    const parts = [{ id: "walking", name: "Хождение", targetMinutes: 60 }];

    expect(getTimerMinutesForAspectPartsOnDate(sessions, "2", "2026-08-25", parts)).toEqual([
      { ...parts[0], actualMinutes: 35 },
    ]);
  });

  it("keeps walking and strength training in separate sport parts", () => {
    const sessions = [
      { date: "2026-08-25", title: "Хождение", color: "#ffd814", durationSeconds: 30 * 60 },
      { date: "2026-08-25", title: "Силовая тренировка", color: "#ffd814", durationSeconds: 45 * 60 },
    ];
    const parts = [
      { id: "walking", name: "Хождение", targetMinutes: 60 },
      { id: "strength", name: "Силовые", targetMinutes: 45 },
    ];

    expect(getTimerMinutesForAspectPartsOnDate(sessions, "2", "2026-08-25", parts)).toEqual([
      { ...parts[0], actualMinutes: 30 },
      { ...parts[1], actualMinutes: 45 },
    ]);
  });
});
