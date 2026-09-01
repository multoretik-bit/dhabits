export interface TimedBlock {
  startTime?: string;
  endTime?: string;
}

export interface HabitWeekSchedule {
  daysOfWeek?: readonly unknown[];
}

export function isHabitScheduledForDay(habit: HabitWeekSchedule, dayOfWeek: number): boolean {
  return habit.daysOfWeek?.some((day) => Number(day) === dayOfWeek) ?? false;
}

/** A one-off adjustment to a block's start/end time, scoped to a single day. */
export interface DayBlockTimeOverride {
  startTime?: string;
  endTime?: string;
}

/**
 * Per-day adjustments to the schedule (reordering, hiding, retiming blocks) that
 * only apply to that specific date and never mutate the underlying recurring block.
 */
export interface DayScheduleOverride {
  order?: string[];
  hidden?: string[];
  times?: Record<string, DayBlockTimeOverride>;
}

export interface IdentifiedTimedBlock extends TimedBlock {
  id: string;
}

export interface ScheduleRestGap {
  start: number;
  end: number;
  duration: number;
}

function parseScheduleTime(time?: string) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Finds every free interval in a calendar day. Overlapping blocks are merged,
 * while blocks crossing midnight occupy both ends of the selected day.
 * Optional split points let point-in-time events appear between adjacent rest cards.
 */
export function getScheduleRestGaps(blocks: TimedBlock[], splitTimes: string[] = []): ScheduleRestGap[] {
  const occupied = blocks.flatMap((block) => {
    const start = parseScheduleTime(block.startTime);
    const end = parseScheduleTime(block.endTime);
    if (start === null || end === null || start === end) return [];
    if (end > start) return [{ start, end }];
    return [{ start: 0, end }, { start, end: 1440 }];
  }).sort((a, b) => a.start - b.start);

  const merged = occupied.reduce<Array<{ start: number; end: number }>>((result, interval) => {
    const previous = result.at(-1);
    if (!previous || interval.start > previous.end) result.push({ ...interval });
    else previous.end = Math.max(previous.end, interval.end);
    return result;
  }, []);

  const gaps: ScheduleRestGap[] = [];
  let cursor = 0;
  for (const interval of merged) {
    if (interval.start > cursor) gaps.push({ start: cursor, end: interval.start, duration: interval.start - cursor });
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < 1440) gaps.push({ start: cursor, end: 1440, duration: 1440 - cursor });

  const splitPoints = Array.from(new Set(splitTimes.map(parseScheduleTime).filter((time): time is number => time !== null))).sort((a, b) => a - b);
  return gaps.flatMap((gap) => {
    const points = splitPoints.filter((point) => point > gap.start && point < gap.end);
    const boundaries = [gap.start, ...points, gap.end];
    return boundaries.slice(0, -1).map((start, index) => ({
      start,
      end: boundaries[index + 1],
      duration: boundaries[index + 1] - start,
    }));
  });
}

export function applyDayScheduleOverride<T extends IdentifiedTimedBlock>(
  blocks: T[],
  override: DayScheduleOverride | undefined
): T[] {
  const hiddenIds = new Set(override?.hidden ?? []);
  const visible = blocks
    .filter((block) => !hiddenIds.has(block.id))
    .map((block) => {
      const timeOverride = override?.times?.[block.id];
      return timeOverride ? { ...block, ...timeOverride } : block;
    });

  const order = override?.order;
  if (!order?.length) return visible;

  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...visible].sort((a, b) => {
    const aIndex = orderIndex.get(a.id) ?? order.length;
    const bIndex = orderIndex.get(b.id) ?? order.length;
    return aIndex - bIndex;
  });
}

export function getCurrentBlock<T extends TimedBlock>(blocks: T[], now: Date): T | null {
  const total = now.getHours() * 60 + now.getMinutes();
  return blocks.find((block) => {
    if (!block.startTime || !block.endTime) return false;
    const [startHours, startMinutes] = block.startTime.split(":").map(Number);
    const [endHours, endMinutes] = block.endTime.split(":").map(Number);
    const start = startHours * 60 + startMinutes;
    const end = endHours * 60 + endMinutes;
    if (![start, end].every(Number.isFinite)) return false;
    return end > start ? total >= start && total < end : total >= start || total < end;
  }) ?? null;
}
