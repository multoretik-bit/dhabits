import type { MonthEvent } from "@/contexts/AppContext";
import { formatDateToDateString } from "@/lib/dateUtils";

function parseDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function differenceInDays(later: Date, earlier: Date) {
  const laterUtc = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const earlierUtc = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((laterUtc - earlierUtc) / 86_400_000);
}

export interface MonthEventOccurrence {
  event: MonthEvent;
  occurrenceStartDate: string;
  isOccurrenceStart: boolean;
}

export function getMonthEventOccurrenceForDate(event: MonthEvent, dateString: string): MonthEventOccurrence | null {
  const start = parseDate(event.startDate);
  const date = parseDate(dateString);
  const difference = differenceInDays(date, start);
  if (difference < 0) return null;

  const duration = Math.max(1, Math.round(event.duration || 1));
  if (event.recurrence !== "weekly") {
    if (difference >= duration) return null;
    return { event, occurrenceStartDate: event.startDate, isOccurrenceStart: difference === 0 };
  }

  const occurrenceOffset = Math.floor(difference / 7) * 7;
  const dayInsideOccurrence = difference - occurrenceOffset;
  if (dayInsideOccurrence >= duration) return null;
  const occurrenceStartDate = formatDateToDateString(addDays(start, occurrenceOffset));
  if (event.repeatUntil && occurrenceStartDate > event.repeatUntil) return null;
  return { event, occurrenceStartDate, isOccurrenceStart: dayInsideOccurrence === 0 };
}

export function monthEventCoversDate(event: MonthEvent, dateString: string) {
  return Boolean(getMonthEventOccurrenceForDate(event, dateString));
}

export function timeFallsWithinBlock(time: string | undefined, startTime?: string, endTime?: string) {
  if (!time || !startTime || !endTime) return false;
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const point = toMinutes(time);
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  if (![point, start, end].every(Number.isFinite)) return false;
  return end > start ? point >= start && point < end : point >= start || point < end;
}
