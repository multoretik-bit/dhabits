import { useState, useEffect, useMemo } from "react";
import { useApp, Habit, Task, HabitBlock, getCurrentBlock, getTodayDateString } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus, ArrowUp, ArrowDown, LayoutGrid, ListTodo, ExternalLink, ListChecks, Sun } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import HabitRow from "@/components/HabitRow";
import Calendar from "@/components/Calendar";
import Timeline from "@/components/Timeline";
import { formatDateToDateString, isSameDay } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

function formatTime(t: string | undefined) {
  return t || "--:--";
}

function timeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function getBlockColor(b: HabitBlock | null | undefined): string | null {
  if (!b) return null;
  if (b.color) return b.color;
  if (b.colorIndex !== undefined) return ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex];
  return null;
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
      {!completed && task.coins && task.coins > 0 && (
        <div 
          className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl text-center"
          style={{ backgroundColor: `${taskColor}25`, border: `1px solid ${taskColor}40` }}
        >
          <img src="/coin.png" alt="coin" className="w-3 h-3 object-contain mb-0.5" />
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
  const { habits, tasks, blocks, wakeUpTimes, setWakeUpTime } = useApp();
  const [, setLocation] = useLocation();
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [wakeUpInput, setWakeUpInput] = useState("08:00");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = formatDateToDateString(selectedDate);
  const isToday = isSameDay(selectedDate, now);
  const dayOfWeek = selectedDate.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  
  // Logic for finding the currently active block (only if today is selected)
  const activeBlock = useMemo(() => {
    if (!isToday) return null;
    const todayBlocks = blocks.filter(b => !b.daysOfWeek || b.daysOfWeek.length === 0 || b.daysOfWeek.includes(dayOfWeek));
    return getCurrentBlock(todayBlocks, now);
  }, [blocks, now, isToday, dayOfWeek]);

  // Determine which block to show details for
  const detailedBlock = useMemo(() => {
    const todayBlocks = blocks.filter(b => !b.daysOfWeek || b.daysOfWeek.length === 0 || b.daysOfWeek.includes(dayOfWeek));
    if (selectedBlockId) return todayBlocks.find(b => b.id === selectedBlockId);
    return activeBlock;
  }, [selectedBlockId, activeBlock, blocks, dayOfWeek]);

  let blockProgress = 0;
  if (detailedBlock?.startTime && detailedBlock?.endTime && isSameDay(selectedDate, now)) {
    const startM = timeToMinutes(detailedBlock.startTime);
    const endM = timeToMinutes(detailedBlock.endTime);
    if (endM > startM) {
      blockProgress = Math.min(100, Math.max(0, ((currentMin - startM) / (endM - startM)) * 100));
    }
  }

  const blockHabits = detailedBlock
    ? habits.filter(h => h.blockId === detailedBlock.id && h.daysOfWeek.includes(dayOfWeek))
    : [];
  const blockTasks = detailedBlock
    ? tasks.filter(t => t.blockId === detailedBlock.id && (t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek)))
    : [];

  const blockIds = new Set(blocks.map(b => b.id));
  const allDayHabits = habits.filter(
    h => (!h.blockId || !blockIds.has(h.blockId)) && h.daysOfWeek.includes(dayOfWeek)
  );
  const allDayTasks = tasks.filter(
    t => t.isAllDay && (t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek))
  );

  // Daily Completion Stats (Only Habits)
  const dailyScheduledHabits = habits.filter(h => h.daysOfWeek.includes(dayOfWeek));
  const dailyCompletedHabits = dailyScheduledHabits.filter(h => !!(h.completedDates && h.completedDates[dateStr]));
  const completionPercentage = dailyScheduledHabits.length > 0 
    ? (dailyCompletedHabits.length / dailyScheduledHabits.length) * 100 
    : 0;

  const blockColor = getBlockColor(detailedBlock);

  return (
    <div 
      className="flex flex-col min-h-screen transition-all duration-700 relative overflow-hidden bg-slate-950"
    >
      {/* Background Glow */}
      {blockColor && (detailedBlock || activeBlock) && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] blur-[120px] opacity-20 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${blockColor} 0%, transparent 70%)` }}
        />
      )}

      {/* Header with Calendar */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pb-4">
        <Calendar selectedDate={selectedDate} onDateChange={(d) => {
          setSelectedDate(d);
          setSelectedBlockId(null);
        }} />
      </div>

      <div className="flex-1 flex flex-col items-center gap-6 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
        {/* Block Switcher (Horizontal Chips) */}
        <div className="w-full max-w-4xl px-2">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 mask-fade-right">
            <button
              onClick={() => setSelectedBlockId(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border",
                !selectedBlockId 
                  ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
              )}
            >
              Сейчас
            </button>
            {blocks.filter(b => !b.daysOfWeek || b.daysOfWeek.length === 0 || b.daysOfWeek.includes(dayOfWeek)).map(b => (
              <button
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border flex items-center gap-2",
                  selectedBlockId === b.id
                    ? "text-white shadow-lg"
                    : "bg-slate-900/40 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                )}
                style={selectedBlockId === b.id ? { 
                  backgroundColor: b.color || "#3b82f6", 
                  borderColor: b.color || "#3b82f6",
                  boxShadow: `0 8px 20px -6px ${b.color || "#3b82f6"}80`
                } : {}}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color || "#fff" }} />
                {b.name}
                <span className="opacity-40 font-bold ml-1">{b.startTime}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main column: Details */}
        <div className="w-full max-w-4xl flex flex-col gap-6 relative z-10">
          
          {/* Wake-up Prompt or Minutes Info */}
          {isToday && (
            <AnimatePresence mode="wait">
              {!wakeUpTimes[dateStr] ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-blue-600/10 border border-blue-500/30 rounded-[32px] p-6 backdrop-blur-md shadow-xl flex flex-col items-center text-center gap-4"
                >
                  <Sun className="w-10 h-10 text-yellow-400 animate-pulse" />
                  <div>
                    <h2 className="text-xl font-black text-white">Во сколько вы проснулись?</h2>
                    <p className="text-xs text-blue-300/70 font-bold uppercase tracking-widest mt-1">Начните свой слепок дня</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="time" 
                      value={wakeUpInput}
                      onChange={(e) => setWakeUpInput(e.target.value)}
                      className="bg-slate-900/80 border border-white/10 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button 
                      onClick={() => setWakeUpTime(dateStr, wakeUpInput)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-2 rounded-xl transition-all shadow-lg active:scale-95"
                    >
                      Я встал!
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/snapshot")}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative bg-slate-900/40 border border-white/5 rounded-[32px] p-6 backdrop-blur-md shadow-xl overflow-hidden text-left"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Clock className="w-24 h-24 text-blue-400 rotate-12" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Слепок дня</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white leading-none">
                        {(() => {
                           const [h, m] = wakeUpTimes[dateStr].split(":").map(Number);
                           const minutesSinceWake = h * 60 + m;
                           const totalMins = 1440 - minutesSinceWake;
                           return totalMins;
                        })()}
                      </span>
                      <span className="text-xl font-bold text-slate-400">минут сегодня</span>
                    </div>
                    <p className="text-sm text-slate-500 font-bold mt-2 flex items-center gap-1.5">
                      Нажмите, чтобы открыть ваш слепок <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>

                  {/* Tiny progress bar showing how much of 'today' has passed since waking up */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                    <motion.div 
                      className="h-full bg-blue-500" 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(() => {
                          const [h, m] = wakeUpTimes[dateStr].split(":").map(Number);
                          const startM = h * 60 + m;
                          const currentM = now.getHours() * 60 + now.getMinutes();
                          const total = 1440 - startM;
                          const elapsed = Math.max(0, currentM - startM);
                          return Math.min(100, (elapsed / total) * 100);
                        })()}%`
                      }}
                    />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          )}

          {/* Daily Progress Counter */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 border border-slate-800/60 rounded-[32px] p-5 backdrop-blur-md shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <ListChecks className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Прогресс дня</h3>
                  <p className="text-sm font-black text-white">Привычки: {dailyCompletedHabits.length} из {dailyScheduledHabits.length}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-blue-400">{Math.round(completionPercentage)}%</span>
              </div>
            </div>
            
            <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ 
                  background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                }}
              />
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={detailedBlock?.id || "free-time"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6"
            >
              {detailedBlock ? (
                <div 
                  className="border rounded-[32px] p-6 shadow-2xl relative overflow-hidden border-white/5"
                  style={{ 
                    backgroundColor: blockColor ? `${blockColor}15` : 'rgba(30, 58, 138, 0.2)',
                    borderColor: blockColor ? `${blockColor}30` : 'rgba(30, 58, 138, 0.3)'
                  }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{detailedBlock.name}</h1>
                      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: blockColor || '#93c5fd' }}>
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(detailedBlock.startTime)} — {formatTime(detailedBlock.endTime)}</span>
                      </div>
                    </div>
                    {detailedBlock.systemUrl ? (
                      <button
                        onClick={() => window.open(detailedBlock.systemUrl, "_blank")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-2xl border border-blue-500/30 transition-all font-bold text-xs shadow-lg group"
                      >
                        <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>Система</span>
                      </button>
                    ) : detailedBlock.habits?.[0]?.emoji && (
                      <div className="text-4xl p-3 bg-white/5 rounded-3xl backdrop-blur-sm shadow-inner overflow-hidden border border-white/5">
                        {detailedBlock.habits[0].emoji}
                      </div>
                    )}
                  </div>

                  {blockProgress > 0 && isToday && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Block Progress</span>
                        <span style={{ color: blockColor || '#fff' }}>{Math.round(blockProgress)}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${blockProgress}%` }}
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{ 
                            background: blockColor 
                              ? `linear-gradient(to right, ${blockColor}, #fff)` 
                              : 'linear-gradient(to right, #2563eb, #22d3ee)' 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Block Habits */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 opacity-60">
                        <LayoutGrid className="w-3 h-3" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">Habits</h3>
                      </div>
                      <div className="space-y-2">
                        {blockHabits.length > 0 ? (
                          blockHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)
                        ) : (
                          <div className="py-4 text-center text-[10px] uppercase tracking-widest font-bold text-slate-600 bg-white/5 rounded-2xl border border-dashed border-white/5">Empty</div>
                        )}
                      </div>
                    </div>

                    {/* Block Tasks */}
                    <div>
                      <div className="flex items-center gap-2 mb-4 opacity-60">
                        <ListTodo className="w-3 h-3" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-100">Tasks</h3>
                      </div>
                      <div className="space-y-2">
                        {blockTasks.length > 0 ? (
                          blockTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)
                        ) : (
                          <div className="py-4 text-center text-[10px] uppercase tracking-widest font-bold text-slate-600 bg-white/5 rounded-2xl border border-dashed border-white/5">None</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-[32px] border-white/5 bg-slate-900/10">
                  <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-4xl mb-6 shadow-2xl border border-white/5">
                    🌊
                  </div>
                  <h2 className="text-3xl font-black text-slate-200 mb-2">Free Time</h2>
                  <p className="text-sm text-slate-500 font-medium max-w-[280px]">Enjoy your rest or check off all-day tasks below</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* All-day items */}
          <div className="mt-8">
            {(allDayHabits.length > 0 || allDayTasks.length > 0) && (
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[1px] flex-1 bg-white/5" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">All-Day Activities</h3>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
              {allDayHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)}
              {allDayTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
