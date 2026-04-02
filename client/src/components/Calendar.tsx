import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getStartOfWeek, getDaysInWeek, isSameDay, getDayName, getMonthName } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function Calendar({ selectedDate, onDateChange }: CalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(selectedDate));
  const [direction, setDirection] = useState(0);

  const days = getDaysInWeek(weekStart);
  const now = new Date();

  const handlePrevWeek = () => {
    setDirection(-1);
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const handleNextWeek = () => {
    setDirection(1);
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newStart);
  };

  useEffect(() => {
    // If external selectedDate changes significantly, update weekStart
    const newWeekStart = getStartOfWeek(selectedDate);
    if (!isSameDay(newWeekStart, weekStart)) {
      setWeekStart(newWeekStart);
    }
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-3 px-4 pt-4 select-none relative z-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-zinc-100 font-bold capitalize">
          {getMonthName(weekStart)}, {weekStart.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevWeek} 
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNextWeek} 
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={weekStart.toISOString()}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex justify-between gap-1"
          >
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, now);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDateChange(day)}
                  className={cn(
                    "flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all duration-300 active:scale-95 relative",
                    isSelected 
                      ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white" 
                      : "hover:bg-white/5 text-zinc-400"
                  )}
                >
                  <span className={cn(
                    "text-[10px] uppercase font-bold tracking-wider mb-1 opacity-60 transition-colors",
                    isSelected ? "text-blue-100" : ""
                  )}>
                    {getDayName(day)}
                  </span>
                  <span className="text-sm font-black transition-all">
                    {day.getDate()}
                  </span>
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
