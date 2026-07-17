import { useState } from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp, type Habit } from "@/contexts/AppContext";
import { spring } from "@/lib/motion";
import HabitUnitTracker from "./HabitUnitTracker";
import CompletionBurst from "./CompletionBurst";

export function StreakFlames({ streak }: { streak: number }) {
  if (!streak) return null;
  return <span className="habit-streak" title={`Серия: ${streak} дней`}>🔥 {streak}</span>;
}

export default function HabitRow({ habit, dateStr, hideUnitTracker }: { habit: Habit; dateStr: string; hideUnitTracker?: boolean }) {
  const { completeHabit, moveHabitUp, moveHabitDown } = useApp();
  const completed = Boolean(habit.completedDates?.[dateStr]);
  const [expanded, setExpanded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const statusColor = habit.status === "implemented" ? "var(--success)" : habit.status === "implementing" ? "#e5a400" : "#dd5b5b";

  const handleComplete = () => {
    if (!completed) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 600);
    }
    completeHabit(habit.id, dateStr);
  };

  return (
    <motion.article
      layout
      transition={spring.soft}
      className={`habit-row ${completed ? "is-completed" : ""}`}
      style={{ borderLeftColor: completed ? `${habit.color}66` : habit.color }}
    >
      <CompletionBurst show={celebrate} color={habit.color} />
      <AnimatePresence>
        {celebrate && <motion.span initial={{ opacity: 0, y: 0 }} animate={{ opacity: 1, y: -25 }} exit={{ opacity: 0 }} className="reward-float">+{habit.coinsPerComplete}</motion.span>}
      </AnimatePresence>
      <div className="habit-row-main">
        <button onClick={handleComplete} className="habit-complete-action" aria-label={`${completed ? "Отменить выполнение" : "Выполнить"}: ${habit.name}`}>
          <span className="habit-status" style={{ backgroundColor: statusColor }} />
          <span className="reward-badge" style={{ backgroundColor: `${habit.color}14`, borderColor: `${habit.color}32` }}>
            <img src="/illustrations/reward-coin-v2.png" alt="" />
            <strong>{habit.coinsPerComplete}</strong>
          </span>
          <span className="item-emoji" style={{ backgroundColor: `${habit.color}14` }}>
            {completed ? <Check className="size-4" /> : habit.emoji}
          </span>
          <span className="item-copy">
            <span onClick={(event) => { event.stopPropagation(); setExpanded((value) => !value); }} className={`item-title ${expanded ? "" : "truncate"}`}>{habit.name}</span>
            <StreakFlames streak={habit.streak} />
          </span>
        </button>
        {!completed && (
          <span className="reorder-controls">
            <button onClick={() => moveHabitUp(habit.id)} aria-label="Переместить привычку выше"><ArrowUp className="size-3" /></button>
            <button onClick={() => moveHabitDown(habit.id)} aria-label="Переместить привычку ниже"><ArrowDown className="size-3" /></button>
          </span>
        )}
      </div>
      {habit.unitsTracking && !completed && !hideUnitTracker && <div className="px-3 pb-3"><HabitUnitTracker habit={habit} /></div>}
    </motion.article>
  );
}
