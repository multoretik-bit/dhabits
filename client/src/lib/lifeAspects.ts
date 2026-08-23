export const LIFE_ASPECT_GROUPS = [
  {
    id: "physical",
    name: "Физические сферы",
    description: "Тело и самочувствие",
    aspectIds: ["1", "2"],
  },
  {
    id: "emotional",
    name: "Эмоциональные сферы",
    description: "Люди и близкие связи",
    aspectIds: ["3", "4", "5"],
  },
  {
    id: "spiritual",
    name: "Духовные сферы",
    description: "Восстановление и направление",
    aspectIds: ["6", "7"],
  },
  {
    id: "mental",
    name: "Ментальные сферы",
    description: "Реализация и рост",
    aspectIds: ["8", "9", "10"],
  },
] as const;

export const LIFE_ASPECTS = [
  { id: "1", name: "Моя внешность", color: "#67e8f9", legacyColors: ["#5eead4", "#00d9ff"] },
  { id: "2", name: "Здоровье", color: "#2815ff", legacyColors: ["#2563eb", "#0066ff"] },
  { id: "3", name: "Отношения", color: "#ff1684", legacyColors: ["#f43f5e", "#ff00ff"] },
  { id: "4", name: "Семья", color: "#ff8508", legacyColors: ["#f97316", "#ff6600"] },
  { id: "5", name: "Окружение", color: "#76ff42", legacyColors: ["#84cc16", "#00cc00"] },
  { id: "6", name: "Отдых", color: "#ffb2b6", legacyColors: ["#fecaca"] },
  { id: "7", name: "Стремления", color: "#5d0794", legacyColors: ["#7c3aed", "#cc00ff"] },
  { id: "8", name: "Бизнес и работа", color: "#ff1017", legacyColors: ["#ef4444", "#ff0000"] },
  { id: "9", name: "Финансы", color: "#00550d", legacyColors: ["#064e3b"] },
  { id: "10", name: "Учёба", color: "#ffd814", legacyColors: ["#facc15", "#ffcc00"] },
] as const;

export const LIFE_ASPECT_COLORS = LIFE_ASPECTS.map((aspect) => aspect.color);

export function getLifeAspectByColor(color?: string) {
  return LIFE_ASPECTS.find((aspect) => aspect.color.toLowerCase() === color?.toLowerCase());
}

export function colorBelongsToLifeAspect(color: string | undefined, aspectId: string) {
  if (!color) return false;
  const aspect = LIFE_ASPECTS.find((item) => item.id === aspectId);
  if (!aspect) return false;
  const normalized = color.toLowerCase();
  return aspect.color.toLowerCase() === normalized || aspect.legacyColors.some((legacy) => legacy.toLowerCase() === normalized);
}

function normalizeActivityTitle(title: string) {
  return title.trim().toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}

export function getTimerActivityAspectId(title: string, color?: string) {
  const normalizedTitle = normalizeActivityTitle(title);

  if (normalizedTitle.includes("работ")) return "8";
  if (normalizedTitle.includes("спорт") || normalizedTitle.includes("хожден")) return "2";
  if (
    normalizedTitle.includes("англий") ||
    normalizedTitle.includes("истори") ||
    normalizedTitle.includes("чтен")
  ) return "10";

  return LIFE_ASPECTS.find((aspect) => colorBelongsToLifeAspect(color, aspect.id))?.id;
}

export interface TimerActivityRecord {
  date: string;
  title: string;
  color?: string;
  durationSeconds: number;
  endedAt?: string;
}

export function getTimerMinutesForAspectOnDate(sessions: TimerActivityRecord[], aspectId: string, date: string) {
  const seconds = sessions.reduce((sum, session) => {
    if (session.date !== date || getTimerActivityAspectId(session.title, session.color) !== aspectId) return sum;
    return sum + Math.max(0, session.durationSeconds || 0);
  }, 0);
  return Math.floor(seconds / 60);
}

export function getTimerMinutesForAspectInYear(sessions: TimerActivityRecord[], aspectId: string, year: number) {
  const seconds = sessions.reduce((sum, session) => {
    const sessionYear = Number(session.date?.slice(0, 4)) || new Date(session.endedAt || "").getFullYear();
    if (sessionYear !== year || getTimerActivityAspectId(session.title, session.color) !== aspectId) return sum;
    return sum + Math.max(0, session.durationSeconds || 0);
  }, 0);
  return Math.floor(seconds / 60);
}
