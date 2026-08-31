export interface UsefulTimeSession {
  date: string;
  durationSeconds: number;
}

const DAY_MS = 86_400_000;

function dateStringToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getUsefulTimeStats(
  sessions: UsefulTimeSession[],
  today: string,
  startDate = "2026-08-01",
) {
  const startTime = dateStringToUtc(startDate);
  const todayTime = dateStringToUtc(today);
  const daysElapsed = todayTime < startTime ? 0 : Math.floor((todayTime - startTime) / DAY_MS) + 1;
  const totalSeconds = sessions.reduce((sum, session) => {
    if (session.date < startDate || session.date > today) return sum;
    return sum + Math.max(0, session.durationSeconds || 0);
  }, 0);

  return {
    totalSeconds,
    daysElapsed,
    averageSecondsPerDay: daysElapsed ? totalSeconds / daysElapsed : 0,
  };
}

export function formatUsefulTime(totalSeconds: number) {
  const totalMinutes = Math.max(0, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} мин`;
  return minutes ? `${hours} ч ${minutes} мин` : `${hours} ч`;
}

export function formatCalendarDays(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  const word = lastTwo >= 11 && lastTwo <= 14
    ? "календарных дней"
    : last === 1
      ? "календарный день"
      : last >= 2 && last <= 4
        ? "календарных дня"
        : "календарных дней";
  return `${count.toLocaleString("ru-RU")} ${word}`;
}
