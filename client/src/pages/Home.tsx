import { useState, useEffect } from "react";
import { useApp, Habit, Task, getCurrentBlock, getTodayDateString } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";

function formatTime(t: string | undefined) {
  return t || "--:--";
}

function timeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Flame streak display
function StreakFlames({ streak }: { streak: number }) {
  if (streak === 0) return null;
  const flames = Math.min(streak, 7);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: flames }).map((_, i) => (
        <span key={i} className="text-[10px] leading-none" style={{ opacity: 0.5 + (i / flames) * 0.5 }}>🔥</span>
      ))}
      {streak > 7 && <span className="text-[10px] text-orange-400 font-bold ml-0.5">×{streak}</span>}
    </div>
  );
}

// Unit progress modal/inline
function UnitTracker({ habit, dateStr }: { habit: Habit; dateStr: string }) {
  const { addUnitsToHabit } = useApp();
  const [amount, setAmount] = useState(1);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 mt-2 bg-slate-900/70 rounded-xl px-2 py-1.5 border border-slate-700/50"
    >
      <span className="text-xs text-slate-400">{habit.progressUnit || "шт"}</span>
      <button
        onClick={() => setAmount(Math.max(1, amount - 1))}
        className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-xs text-white font-bold w-5 text-center">{amount}</span>
      <button
        onClick={() => setAmount(amount + 1)}
        className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600"
      >
        <Plus className="w-3 h-3" />
      </button>
      <button
        onClick={() => addUnitsToHabit(habit.id, amount)}
        className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-lg text-white"
        style={{ backgroundColor: habit.color }}
      >
        +{amount}
      </button>
    </div>
  );
}

function HabitRow({ habit, dateStr }: { habit: Habit; dateStr: string }) {
  const { completeHabit } = useApp();
  const completed = !!(habit.completedDates && habit.completedDates[dateStr]);

  return (
    <div
      className={`w-full flex flex-col rounded-2xl transition-all mb-2 overflow-hidden border
        ${completed
          ? "opacity-60 border-slate-800/40"
          : "border-slate-800/80 shadow-sm"
        }`}
      style={{
        background: completed
          ? "rgba(15,23,42,0.5)"
          : `linear-gradient(135deg, ${habit.color}18 0%, rgba(15,23,42,0.7) 100%)`,
        borderLeft: `3px solid ${habit.color}`,
      }}
    >
      <button
        onClick={() => completeHabit(habit.id, dateStr)}
        className="flex items-center gap-3 p-3 text-left"
      >
        {/* Coin badge LEFT */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center w-11 h-11 rounded-xl text-center"
          style={{ backgroundColor: `${habit.color}25`, border: `1px solid ${habit.color}40` }}
        >
          <span className="text-[14px] leading-none">🪙</span>
          <span className="text-[10px] font-bold text-white leading-tight mt-0.5">{habit.coinsPerComplete}</span>
        </div>

        {/* Emoji */}
        <span
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: completed ? "#1e293b" : `${habit.color}22` }}
        >
          {completed ? <Check className="w-4 h-4 text-slate-500" /> : habit.emoji}
        </span>

        {/* Name + streak */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug ${completed ? "line-through text-slate-500" : "text-slate-100"}`}>
            {habit.name}
          </p>
          <StreakFlames streak={habit.streak} />
          {habit.unitsTracking && (
            <span className="text-[10px] text-slate-500">
              Всего: {habit.units} {habit.progressUnit || "шт"} · +{habit.coinsPerUnit || 1} монет/шт
            </span>
          )}
        </div>
      </button>

      {/* Unit tracker (shown when not completed) */}
      {habit.unitsTracking && !completed && (
        <div className="px-3 pb-3">
          <UnitTracker habit={habit} dateStr={dateStr} />
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, dateStr }: { task: Task; dateStr: string }) {
  const { completeTask } = useApp();
  const completed = !!(task.completedDates && task.completedDates[dateStr]);
  return (
    <button
      onClick={() => completeTask(task.id, dateStr)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-2
        ${completed ? "bg-slate-900/30 opacity-50 border border-slate-800/40" : "bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-blue-700/50"}`}
    >
      <span className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl bg-slate-800/50">
        {completed ? <Check className="w-5 h-5 text-slate-500" /> : (task.emoji || "📋")}
      </span>
      <span className={`flex-1 font-medium text-sm leading-snug ${completed ? "line-through text-slate-500" : "text-slate-200"}`}>
        {task.title}
      </span>
    </button>
  );
}

export default function Home() {
  const { habits, tasks, blocks } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = getTodayDateString();
  const dayOfWeek = now.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const activeBlock = getCurrentBlock(blocks, now);

  let blockProgress = 0;
  if (activeBlock?.startTime && activeBlock?.endTime) {
    const startM = timeToMinutes(activeBlock.startTime);
    const endM = timeToMinutes(activeBlock.endTime);
    if (endM > startM) {
      blockProgress = Math.min(100, Math.max(0, ((currentMin - startM) / (endM - startM)) * 100));
    }
  }

  const blockHabits = activeBlock
    ? habits.filter(h => h.blockId === activeBlock.id && h.daysOfWeek.includes(dayOfWeek))
    : [];
  const blockTasks = activeBlock
    ? tasks.filter(t => t.blockId === activeBlock.id && (t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek)))
    : [];

  const blockIds = new Set(blocks.map(b => b.id));
  const allDayHabits = habits.filter(
    h => (!h.blockId || !blockIds.has(h.blockId)) && h.daysOfWeek.includes(dayOfWeek)
  );
  const allDayTasks = tasks.filter(
    t => t.isAllDay && (t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek))
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Active Block Header */}
      <div className="px-5 pt-6 pb-2">
        {activeBlock ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-blue-950/40 border border-blue-900/50 rounded-3xl p-5 shadow-lg relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 blur-[50px] rounded-full" />
            <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{activeBlock.name}</h1>
            <div className="flex items-center gap-1.5 text-blue-300 text-sm font-medium mb-4">
              <Clock className="w-4 h-4" />
              <span>с {formatTime(activeBlock.startTime)} до {formatTime(activeBlock.endTime)}</span>
            </div>
            {activeBlock.startTime && activeBlock.endTime && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-semibold text-blue-200">
                  <span>Прогресс блока</span>
                  <span>{Math.round(blockProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-blue-950/50 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${blockProgress}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000"
                    style={{ left: `calc(${blockProgress}% - 8px)` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-slate-300">Свободное время</h2>
            <p className="text-sm text-slate-500 mt-1">Отдыхайте или выполняйте задачи на весь день</p>
          </div>
        )}
      </div>

      {/* Block habits & tasks in 2 columns */}
      {activeBlock && (
        <div className="px-4 py-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Привычки</h3>
            {blockHabits.length > 0 ? (
              blockHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} />)
            ) : (
              <div className="text-xs text-slate-600 text-center py-4 bg-slate-900/30 rounded-2xl border border-slate-800/50">Пусто</div>
            )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Задачи</h3>
            {blockTasks.length > 0 ? (
              blockTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)
            ) : (
              <div className="text-xs text-slate-600 text-center py-4 bg-slate-900/30 rounded-2xl border border-slate-800/50">Без задач</div>
            )}
          </div>
        </div>
      )}

      {/* All-day divider */}
      {(allDayHabits.length > 0 || allDayTasks.length > 0) && (
        <div className="mt-2 mb-2 px-6">
          <div className="w-full h-[1px] bg-slate-800/60" />
        </div>
      )}

      {/* All-day items */}
      <div className="px-5 pb-8 space-y-1">
        {(allDayHabits.length > 0 || allDayTasks.length > 0) && (
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 mt-2 px-1">На весь день</h3>
        )}
        {allDayHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} />)}
        {allDayTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)}
      </div>
    </div>
  );
}
