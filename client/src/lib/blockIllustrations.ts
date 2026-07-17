import type { HabitBlock } from "@/contexts/AppContext";

const KEYWORDS = {
  movement: /спорт|трен|зал|бег|йог|движ|fitness|workout/i,
  study: /уч|образован|чтен|книг|курс|study|learn/i,
  work: /работ|фокус|дел|проект|бизнес|контент|work|focus/i,
  evening: /вечер|отдых|сон|релакс|сем|дом|rest|sleep|night/i,
};

function startHour(block: HabitBlock) {
  const hour = Number(block.startTime?.split(":")[0]);
  return Number.isFinite(hour) ? hour : 9;
}

export function getBlockIllustration(block?: HabitBlock | null) {
  if (!block) return "/illustrations/focus-companion.png";

  const name = block.name || "";
  if (KEYWORDS.movement.test(name)) return "/illustrations/block-movement.png";
  if (KEYWORDS.study.test(name)) return "/illustrations/block-study.png";
  if (KEYWORDS.work.test(name)) return "/illustrations/block-work.png";
  if (KEYWORDS.evening.test(name)) return "/illustrations/block-evening.png";

  const hour = startHour(block);
  if (hour < 11) return "/illustrations/focus-companion.png";
  if (hour < 17) return "/illustrations/block-work.png";
  return "/illustrations/block-evening.png";
}
