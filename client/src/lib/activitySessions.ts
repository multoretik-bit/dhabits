import type { ActivitySession } from "@/contexts/AppContext";

export interface ActivitySessionGroup {
  key: string;
  title: string;
  color: string;
  seconds: number;
  sessions: ActivitySession[];
}

export function groupActivitySessionsByTitle(sessions: ActivitySession[]) {
  const totals = new Map<string, ActivitySessionGroup>();

  sessions.forEach((session) => {
    const key = session.title.trim().toLocaleLowerCase("ru-RU");
    const current = totals.get(key);
    if (current) {
      current.seconds += session.durationSeconds;
      current.sessions.push(session);
      return;
    }
    totals.set(key, {
      key,
      title: session.title.trim(),
      color: session.color,
      seconds: session.durationSeconds,
      sessions: [session],
    });
  });

  return Array.from(totals.values()).sort((a, b) => b.seconds - a.seconds);
}
