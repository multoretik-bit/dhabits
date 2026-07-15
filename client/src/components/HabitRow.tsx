import { useState } from "react";
import { useApp, Habit } from "@/contexts/AppContext";
import { Check, ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HabitUnitTracker from "./HabitUnitTracker";
import CompletionBurst from "./CompletionBurst";
import { spring } from "@/lib/motion";

// Flame streak display
export function StreakFlames({ streak }: { streak: number }) {
  if (streak === 0) return null;
  const hot = streak >= 3;
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit ${hot ? "animate-pulse" : ""}`}
      style={hot ? { boxShadow: "0 0 10px rgba(245,158,11,0.35)" } : undefined}
    >
      <span className="text-[12px]">🔥</span>
      <span className="text-[11px] font-bold text-orange-400">{streak}</span>
    </div>
  );
}

interface HabitRowProps {
  habit: Habit;
  dateStr: string;
  hideUnitTracker?: boolean;
}

export default function HabitRow({ habit, dateStr, hideUnitTracker }: HabitRowProps) {
  const { completeHabit, moveHabitUp, moveHabitDown } = useApp();
  const completed = !!(habit.completedDates && habit.completedDates[dateStr]);
  const [expanded, setExpanded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const handleComplete = () => {
    if (!completed) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 600);
    }
    completeHabit(habit.id, dateStr);
  };

  return (
    <motion.div
      layout
      transition={spring.soft}
      className={`relative w-full flex flex-col rounded-2xl transition-colors mb-2 overflow-hidden
        ${completed
          ? "opacity-60 border border-orange-200/5"
          : "backdrop-blur-sm border border-orange-200/5 shadow-sm hover:border-orange-300/20"
        }`}
      style={{
        borderLeft: `3px solid ${completed ? habit.color + '44' : habit.color}`,
        background: completed
          ? "rgba(36,26,48,0.5)"
          : `linear-gradient(135deg, ${habit.color}14 0%, rgba(36,26,48,0.6) 100%)`,
      }}
    >
      <CompletionBurst show={celebrate} color={habit.color} />

      <AnimatePresence>
        {celebrate && (
          <motion.span
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -28, scale: 1.1 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute left-12 top-2 z-20 text-sm font-black pointer-events-none"
            style={{ color: "var(--coin)" }}
          >
            +{habit.coinsPerComplete}
          </motion.span>
        )}
      </AnimatePresence>

      <button
        onClick={handleComplete}
        className="flex items-center gap-2 p-3 text-left w-full"
      >
        {/* Status Indicator */}
        <div
          className="w-1.5 h-10 rounded-full shrink-0"
          style={{
             backgroundColor: habit.status === 'implemented' ? '#22c55e' : habit.status === 'implementing' ? '#eab308' : '#ef4444',
             boxShadow: `0 0 8px ${habit.status === 'implemented' ? '#22c55e' : habit.status === 'implementing' ? '#eab308' : '#ef4444'}40`
          }}
          title={habit.status === 'implemented' ? 'Уже введена' : habit.status === 'implementing' ? 'Внедряется' : 'Планируется'}
        />

        {/* Coin badge LEFT */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl text-center"
          style={{ backgroundColor: `${habit.color}25`, border: `1px solid ${habit.color}40` }}
        >
          <img src="/coin.png" alt="coin" className="w-3.5 h-3.5 object-contain mb-0.5" />
          <span className="text-[10px] font-bold text-white leading-tight mt-0.5">{habit.coinsPerComplete}</span>
        </div>

        {/* Emoji */}
        <motion.span
          key={completed ? "done" : "pending"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.bouncy}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: completed ? "#2f2240" : `${habit.color}22` }}
        >
          {completed ? <Check className="w-4 h-4 text-slate-500" /> : habit.emoji}
        </motion.span>

        {/* Name + streak */}
        <div className="flex-1 min-w-0">
          <p 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className={`font-semibold text-sm leading-snug cursor-pointer ${completed ? "line-through text-slate-500" : "text-slate-100"} ${expanded ? "" : "truncate"}`}
          >
            {habit.name}
          </p>
          <StreakFlames streak={habit.streak} />
        </div>

        {/* Reorder controls */}
        {!completed && (
          <div className="flex flex-col gap-1 pr-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => moveHabitUp(habit.id)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-orange-300 transition-colors">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button onClick={() => moveHabitDown(habit.id)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-orange-300 transition-colors">
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </button>

      {/* Unit tracker (shown when not completed and not hidden by prop) */}
      {habit.unitsTracking && !completed && !hideUnitTracker && (
        <div className="px-3 pb-3">
          <HabitUnitTracker habit={habit} />
        </div>
      )}
    </motion.div>
  );
}
