export interface TimedBlock {
  startTime?: string;
  endTime?: string;
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
