import type { ActivitySession, Goal } from "@/contexts/AppContext";

function normalizeActivityName(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
}

export function getGoalProgressForDate(goal: Goal, sessions: ActivitySession[], date: string) {
  if (goal.progressType !== "activity_minutes" || !goal.activityName?.trim()) {
    return Math.round(Math.max(0, goal.progressByDate?.[date] || 0) * 10) / 10;
  }

  const activityName = normalizeActivityName(goal.activityName);
  const trackingStartedAt = goal.activityTrackingStartedAt
    ? new Date(goal.activityTrackingStartedAt).getTime()
    : 0;
  const seconds = sessions.reduce((sum, session) => {
    if (session.date !== date || normalizeActivityName(session.title) !== activityName) return sum;
    const recordedAt = new Date(session.createdAt || session.endedAt).getTime();
    if (Number.isFinite(trackingStartedAt) && Number.isFinite(recordedAt) && recordedAt < trackingStartedAt) return sum;
    return sum + Math.max(0, session.durationSeconds || 0);
  }, 0);

  return Math.round(seconds / 6) / 10;
}

export function getGoalProgressUnit(goal: Goal) {
  return goal.progressType === "activity_minutes" ? "мин" : goal.unit?.trim() || "ед.";
}
