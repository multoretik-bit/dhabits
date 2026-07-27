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
