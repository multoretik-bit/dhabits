import { describe, expect, it } from "vitest";
import type { ActivitySession, Goal } from "@/contexts/AppContext";
import { getGoalProgressForDate, getGoalProgressUnit } from "./goalProgress";

const baseGoal: Goal = {
  id: "goal-1", name: "Цель", emoji: "🎯", description: "", linkedHabits: [], coins: 10,
  streak: 0, folder: "general", completed: false, startValue: 0, targetValue: 100,
  currentValue: 0, color: "#fff",
};

describe("goal daily progress", () => {
  it("returns only the manual progress saved for the requested date", () => {
    const goal = { ...baseGoal, unit: "ккал", progressByDate: { "2026-08-25": 430, "2026-08-24": 200 } };
    expect(getGoalProgressForDate(goal, [], "2026-08-25")).toBe(430);
    expect(getGoalProgressUnit(goal)).toBe("ккал");
  });

  it("counts today's timer minutes only for the linked activity", () => {
    const goal = { ...baseGoal, progressType: "activity_minutes" as const, activityName: "Чтение", activityTrackingStartedAt: "2026-08-25T08:00:00.000Z" };
    const sessions: ActivitySession[] = [
      { id: "1", date: "2026-08-25", title: " Чтение ", color: "#fff", startedAt: "", endedAt: "2026-08-25T09:30:00.000Z", createdAt: "2026-08-25T09:30:00.000Z", durationSeconds: 1800 },
      { id: "2", date: "2026-08-25", title: "Английский", color: "#fff", startedAt: "", endedAt: "2026-08-25T10:00:00.000Z", durationSeconds: 900 },
      { id: "3", date: "2026-08-24", title: "Чтение", color: "#fff", startedAt: "", endedAt: "2026-08-24T10:00:00.000Z", durationSeconds: 1200 },
    ];
    expect(getGoalProgressForDate(goal, sessions, "2026-08-25")).toBe(30);
    expect(getGoalProgressUnit(goal)).toBe("мин");
  });
});
