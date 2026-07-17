import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getStartOfWeek, getDaysInWeek, isSameDay, getDayName, getMonthName } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

export default function Calendar({ selectedDate, onDateChange }: { selectedDate: Date; onDateChange: (date: Date) => void }) {
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(selectedDate));
  const [direction, setDirection] = useState(0);
  const days = getDaysInWeek(weekStart);
  const today = new Date();

  const changeWeek = (offset: number) => {
    setDirection(offset);
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + offset * 7);
      return next;
    });
  };

  useEffect(() => {
    const selectedWeek = getStartOfWeek(selectedDate);
    if (!isSameDay(selectedWeek, weekStart)) setWeekStart(selectedWeek);
  }, [selectedDate]);

  return (
    <section className="week-calendar" aria-label="Календарь недели">
      <div className="week-calendar-head">
        <h2>{getMonthName(weekStart)}, {weekStart.getFullYear()}</h2>
        <div className="flex gap-1">
          <button className="icon-button is-small" onClick={() => changeWeek(-1)} aria-label="Предыдущая неделя"><ChevronLeft className="size-4" /></button>
          <button className="icon-button is-small" onClick={() => changeWeek(1)} aria-label="Следующая неделя"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={weekStart.toISOString()}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="week-days"
          >
            {days.map((day) => {
              const selected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateChange(day)}
                  className={cn("week-day", selected && "is-selected", isToday && "is-today")}
                  aria-pressed={selected}
                >
                  <span>{getDayName(day)}</span>
                  <strong>{day.getDate()}</strong>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
