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

const ACTIVITY_PART_STEMS = ["спорт", "хожден", "силов", "англий", "истори", "чтен"];

function getActivityPartMatchScore(title: string, partName: string) {
  const normalizedTitle = normalizeActivityTitle(title);
  const normalizedPartName = normalizeActivityTitle(partName);
  if (!normalizedPartName) return 0;
  if (normalizedTitle === normalizedPartName) return 10_000 + normalizedPartName.length;

  const titleWords = normalizedTitle.split(/[^a-zа-я0-9]+/i).filter(Boolean);
  const partWords = normalizedPartName.split(/[^a-zа-я0-9]+/i).filter(Boolean);
  const wordsMatch = (left: string, right: string) => {
    if (left === right) return true;
    if (Math.min(left.length, right.length) >= 5 && left.slice(0, 5) === right.slice(0, 5)) return true;
    return ACTIVITY_PART_STEMS.some((stem) => left.includes(stem) && right.includes(stem));
  };
  const matchingWords = partWords.filter((word) => titleWords.some((titleWord) => wordsMatch(word, titleWord))).length;
  if (partWords.length > 0 && matchingWords === partWords.length) {
    return 2_000 + matchingWords * 100 + normalizedPartName.length;
  }
  if (normalizedTitle.includes(normalizedPartName) || normalizedPartName.includes(normalizedTitle)) {
    return 1_000 + normalizedPartName.length;
  }
  if (ACTIVITY_PART_STEMS.some((stem) => normalizedTitle.includes(stem) && normalizedPartName.includes(stem))) {
    return 100 + normalizedPartName.length;
  }
  return 0;
}

function findMatchingActivityPart<T extends LifeAspectDailyPart>(title: string, parts: T[]) {
  return parts.reduce<{ part?: T; score: number }>((best, part) => {
    const score = getActivityPartMatchScore(title, part.name);
    return score > best.score ? { part, score } : best;
  }, { score: 0 }).part;
}

export function getTimerActivityAspectId(title: string, color?: string) {
  const normalizedTitle = normalizeActivityTitle(title);

  if (normalizedTitle.includes("работ")) return "8";
  if (
    normalizedTitle.includes("спорт") ||
    normalizedTitle.includes("хожден") ||
    normalizedTitle.includes("силов")
  ) return "2";
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

export interface LifeAspectDailyPart {
  id: string;
  name: string;
  targetMinutes: number;
  rewardPerMinute?: number;
}

export function getActivityRewardPerMinute(
  title: string,
  color: string | undefined,
  systems: Array<{ id: string; rewardPerMinute?: number; dailyParts?: LifeAspectDailyPart[] }>,
) {
  const aspectId = getTimerActivityAspectId(title, color);
  if (!aspectId) return undefined;
  const system = systems.find((item) => item.id === aspectId);
  const part = system?.dailyParts ? findMatchingActivityPart(title, system.dailyParts) : undefined;
  return part?.rewardPerMinute ?? system?.rewardPerMinute;
}

export function getTimerMinutesForAspectOnDate(sessions: TimerActivityRecord[], aspectId: string, date: string) {
  const seconds = sessions.reduce((sum, session) => {
    if (session.date !== date || getTimerActivityAspectId(session.title, session.color) !== aspectId) return sum;
    return sum + Math.max(0, session.durationSeconds || 0);
  }, 0);
  return Math.floor(seconds / 60);
}

export function getTimerMinutesForAspectPartsOnDate(
  sessions: TimerActivityRecord[],
  aspectId: string,
  date: string,
  parts: LifeAspectDailyPart[],
) {
  const totals = new Map(parts.map((part) => [part.id, 0]));

  sessions.forEach((session) => {
    if (session.date !== date || getTimerActivityAspectId(session.title, session.color) !== aspectId) return;
    const matchedPart = findMatchingActivityPart(session.title, parts);
    if (!matchedPart) return;
    totals.set(matchedPart.id, (totals.get(matchedPart.id) || 0) + Math.max(0, session.durationSeconds || 0));
  });

  return parts.map((part) => ({
    ...part,
    actualMinutes: Math.floor((totals.get(part.id) || 0) / 60),
  }));
}

export function getTimerMinutesForAspectInYear(sessions: TimerActivityRecord[], aspectId: string, year: number) {
  const seconds = sessions.reduce((sum, session) => {
    const sessionYear = Number(session.date?.slice(0, 4)) || new Date(session.endedAt || "").getFullYear();
    if (sessionYear !== year || getTimerActivityAspectId(session.title, session.color) !== aspectId) return sum;
    return sum + Math.max(0, session.durationSeconds || 0);
  }, 0);
  return Math.floor(seconds / 60);
}
