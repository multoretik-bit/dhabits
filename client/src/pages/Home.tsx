import { useState, useEffect } from "react";
import { useApp, Habit, Task, getCurrentBlock, getTodayDateString } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import HabitUnitTracker from "@/components/HabitUnitTracker";

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
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit">
      <span className="text-[12px]">🔥</span>
      <span className="text-[11px] font-bold text-orange-400">{streak}</span>
    </div>
  );
}

function HabitRow({ habit, dateStr }: { habit: Habit; dateStr: string }) {
  const { completeHabit, moveHabitUp, moveHabitDown } = useApp();
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

        {/* Reorder controls */}
        {!completed && (
          <div className="flex flex-col gap-1 pr-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => moveHabitUp(habit.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
              <ArrowUp className="w-3 h-3" />
            </button>
            <button onClick={() => moveHabitDown(habit.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
              <ArrowDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </button>

      {/* Unit tracker (shown when not completed) */}
      {habit.unitsTracking && !completed && (
        <div className="px-3 pb-3">
          <HabitUnitTracker habit={habit} />
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, dateStr }: { task: Task; dateStr: string }) {
  const { completeTask, moveTaskUp, moveTaskDown } = useApp();
  const completed = !!(task.completedDates && task.completedDates[dateStr]);
  const taskColor = task.color || "#3b82f6";

  return (
    <button
      onClick={() => completeTask(task.id, dateStr)}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left mb-2 overflow-hidden border
        ${completed ? "opacity-60 border-slate-800/40" : "bg-slate-900/60 border-slate-800/80 shadow-sm hover:border-blue-700/50"}`}
      style={{ 
        borderLeft: completed ? `3px solid ${taskColor}44` : `3px solid ${taskColor}`,
        background: completed ? "rgba(15,23,42,0.4)" : `linear-gradient(135deg, ${taskColor}12 0%, rgba(15,23,42,0.6) 100%)`
      }}
    >
      {/* Coin badge LEFT */}
      {!completed && task.coins && task.coins > 0 && (
        <div 
          className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl text-center"
          style={{ backgroundColor: `${taskColor}25`, border: `1px solid ${taskColor}40` }}
        >
          <span className="text-[12px] leading-none">🪙</span>
          <span className="text-[9px] font-bold text-white leading-tight mt-0.5">{task.coins}</span>
        </div>
      )}

      <span 
        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: completed ? "#1e293b" : `${taskColor}22` }}
      >
        {completed ? <Check className="w-5 h-5 text-slate-500" /> : (task.emoji || "📋")}
      </span>
      <span className={`flex-1 font-bold text-sm leading-snug ${completed ? "line-through text-slate-500" : "text-slate-100"}`}>
        {task.title}
      </span>

      {/* Reorder controls */}
      {!completed && (
        <div className="flex flex-col gap-1 pr-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => moveTaskUp(task.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
            <ArrowUp className="w-3 h-3" />
          </button>
          <button onClick={() => moveTaskDown(task.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      )}
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

  const blockColor = activeBlock?.colorIndex !== undefined 
    ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][activeBlock.colorIndex] 
    : null;

  return (
    <div 
      className="flex flex-col min-h-full transition-all duration-700 relative overflow-hidden"
      style={{ 
        backgroundColor: blockColor ? `${blockColor}08` : 'transparent'
      }}
    >
      {/* Background Glow */}
      {blockColor && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] blur-[120px] opacity-20 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${blockColor} 0%, transparent 70%)` }}
        />
      )}

      {/* Active Block Header */}
      <div className="px-5 pt-6 pb-2">
        {activeBlock ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="border rounded-3xl p-5 shadow-lg relative overflow-hidden"
            style={{ 
              backgroundColor: activeBlock.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][activeBlock.colorIndex] + '20' : 'rgba(30, 58, 138, 0.4)',
              borderColor: activeBlock.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][activeBlock.colorIndex] + '40' : 'rgba(30, 58, 138, 0.5)'
            }}
          >
            <div 
              className="absolute -top-10 -right-10 w-32 h-32 blur-[50px] rounded-full opacity-30" 
              style={{ backgroundColor: activeBlock.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][activeBlock.colorIndex] : '#3b82f6' }}
            />
            <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight truncate">{activeBlock.name}</h1>
            <div className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: activeBlock.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][activeBlock.colorIndex] : '#93c5fd' }}>
              <Clock className="w-4 h-4" />
              <span>с {formatTime(activeBlock.startTime)} до {formatTime(activeBlock.endTime)}</span>
            </div>
            {activeBlock.startTime && activeBlock.endTime && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-semibold text-blue-200">
                  <span>Прогресс блока</span>
                  <span>{Math.round(blockProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${blockProgress}%`,
                      background: activeBlock.colorIndex !== undefined 
                        ? `linear-gradient(to right, ${["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][activeBlock.colorIndex]}, #fff)` 
                        : 'linear-gradient(to right, #2563eb, #22d3ee)' 
                    }}
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
        <div className="px-3 py-4 grid grid-cols-2 gap-2 sm:gap-4 relative z-10">
          <div className="flex flex-col">
            <h3 
              className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 px-2 opacity-60"
              style={{ color: blockColor || '#94a3b8' }}
            >
              Привычки
            </h3>
            {blockHabits.length > 0 ? (
              blockHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} />)
            ) : (
              <div className="text-xs text-slate-600 text-center py-6 bg-slate-900/20 rounded-3xl border border-slate-800/40 italic">Пусто</div>
            )}
          </div>
          <div className="flex flex-col">
            <h3 
              className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 px-2 opacity-60"
              style={{ color: blockColor || '#94a3b8' }}
            >
              Задачи
            </h3>
            {blockTasks.length > 0 ? (
              blockTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)
            ) : (
              <div className="text-xs text-slate-600 text-center py-6 bg-slate-900/20 rounded-3xl border border-slate-800/40 italic">Без задач</div>
            )}
          </div>
        </div>
      )}

      {/* All-day divider */}
      {(allDayHabits.length > 0 || allDayTasks.length > 0) && (
        <div className="mt-4 mb-4 px-6 relative z-10">
          <div className="w-full h-px" style={{ backgroundColor: blockColor ? `${blockColor}20` : 'rgba(30, 41, 59, 0.5)' }} />
        </div>
      )}

      {/* All-day items */}
      <div className="px-5 pb-10 space-y-1 relative z-10">
        {(allDayHabits.length > 0 || allDayTasks.length > 0) && (
          <h3 
            className="text-[11px] font-black uppercase tracking-[0.2em] mb-5 mt-2 px-2 opacity-60 text-slate-400"
          >
            На весь день
          </h3>
        )}
        {allDayHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} />)}
        {allDayTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)}
      </div>
    </div>
  );
}
