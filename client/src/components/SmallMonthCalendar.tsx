import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { isSameDay, getDaysInMonth, getFirstDayOfMonth } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function SmallMonthCalendar({ selectedDate, onSelectDate }: { selectedDate: Date; onSelectDate: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  // getFirstDayOfMonth returns 0 for Sun, 1 for Mon. We want Mon=0, Sun=6.
  let firstDayIndex = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold text-white capitalize">
          {currentMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-500">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="w-full aspect-square" />;
          
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={cn(
                "w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                isSelected ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-bold" 
                  : isToday ? "bg-white/10 text-white border border-white/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
