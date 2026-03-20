import { useState, useEffect } from "react";
import { useApp, HabitBlock, Habit, Task, getCurrentBlock, getTodayDateString } from "@/contexts/AppContext";
import { CheckCircle2, Circle, Clock, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Formatting helpers ───────────────────────────────────────────────────

function formatTime(t: string | undefined) {
  return t || "--:--";
}

function timeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function nowTimeStr(now: Date) {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// ─── ItemRows ─────────────────────────────────────────────────────────────

function HabitRow({ habit, dateStr }: { habit: Habit; dateStr: string }) {
  const { completeHabit } = useApp();
  const completed = !!(habit.completedDates && habit.completedDates[dateStr]);
  return (
    <button
      onClick={() => completeHabit(habit.id, dateStr)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-2
        ${completed ? "bg-blue-950/20 opacity-50 border border-blue-900/20" : "bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-blue-700/50"}`}
    >
      <span
        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: completed ? "#1e293b" : habit.color + "22" }}
      >
        {completed ? <Check className="w-5 h-5 text-slate-500" /> : habit.emoji}
      </span>
      <span className={`flex-1 font-medium text-sm leading-snug ${completed ? "line-through text-slate-500" : "text-slate-200"}`}>
        {habit.name}
      </span>
    </button>
  );
}

function TaskRow({ task, dateStr }: { task: Task; dateStr: string }) {
  const { completeTask } = useApp();
  const completed = !!(task.completedDates && task.completedDates[dateStr]);
  return (
    <button
      onClick={() => completeTask(task.id, dateStr)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-2
        ${completed ? "bg-blue-950/20 opacity-50 border border-blue-900/20" : "bg-slate-900/60 border border-slate-800/80 shadow-sm hover:border-blue-700/50"}`}
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

// ─── Main ─────────────────────────────────────────────────────────────────

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

  // Time progress bar calculations
  let blockProgress = 0;
  if (activeBlock && activeBlock.startTime && activeBlock.endTime) {
    const startM = timeToMinutes(activeBlock.startTime);
    const endM = timeToMinutes(activeBlock.endTime);
    if (endM > startM) {
      blockProgress = Math.min(100, Math.max(0, ((currentMin - startM) / (endM - startM)) * 100));
    }
  }

  // Filter items for current block
  const blockHabits = activeBlock 
    ? habits.filter(h => h.blockId === activeBlock.id && h.daysOfWeek.includes(dayOfWeek))
    : [];
  const blockTasks = activeBlock
    ? tasks.filter(t => t.blockId === activeBlock.id && (t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek)))
    : [];

  // Filter all-day items
  const blockIds = new Set(blocks.map((b) => b.id));
  const allDayHabits = habits.filter(
    (h) => (!h.blockId || !blockIds.has(h.blockId)) && h.daysOfWeek.includes(dayOfWeek)
  );
  const allDayTasks = tasks.filter(
    (t) => t.isAllDay && (t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek))
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Header Block Info */}
      <div className="px-5 pt-6 pb-2">
        {activeBlock ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="bg-blue-950/40 border border-blue-900/50 rounded-3xl p-5 shadow-lg relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
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
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-in-out" 
                    style={{ width: `${blockProgress}%` }}
                  />
                  {/* Now indicator pulse */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-1000 ease-in-out"
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

      {/* Grid: Habits & Tasks for the Block */}
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

      {/* Separator if needed */}
      {(allDayHabits.length > 0 || allDayTasks.length > 0) && (
        <div className="mt-2 mb-2 px-6">
          <div className="w-full h-[1px] bg-slate-800/60" />
        </div>
      )}

      {/* All-Day Items */}
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
