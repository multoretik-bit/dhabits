import { useState, useEffect, useMemo } from "react";
import { useApp, Habit, Task, HabitBlock, getTodayDateString, SnapshotEntry, getCurrentBlock } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus, ArrowUp, ArrowDown, LayoutGrid, ListTodo, ExternalLink, Target, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import HabitRow from "@/components/HabitRow";
import Calendar from "@/components/Calendar";
import { formatDateToDateString, isSameDay } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";
import { nanoid } from "nanoid";

const CATEGORIES = [
  { id: "work", label: "Работа", icon: "💼", color: "#ff0000" },
  { id: "study", label: "Учёба", icon: "📚", color: "#ffff00" },
  { id: "productive", label: "Продуктивное", icon: "🧠", color: "#8100eb" },
  { id: "sport", label: "Спорт", icon: "🏃", color: "#0000ff" },
  { id: "useless", label: "Бесполезное", icon: "😴", color: "#94a3b8" },
  { id: "home", label: "Быт", icon: "🏠", color: "#06b6d4" },
  { id: "rest", label: "Отдых", icon: "🧘", color: "#fe8181" },
];

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

function TaskRow({ task, dateStr, isCondensed }: { task: Task; dateStr: string; isCondensed?: boolean }) {
  const { completeTask, moveTaskUp, moveTaskDown, toggleSubtask } = useApp();
  const [expanded, setExpanded] = useState(false);
  const completed = !!(task.completedDates && task.completedDates[dateStr]);
  const taskColor = task.color || "#3b82f6";
  
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className={cn("mb-3", isCondensed && "mb-2")}>
      <div
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left overflow-hidden cursor-pointer hover-lift shadow-sm",
          completed ? "opacity-60 bg-slate-900/40 border border-white/5" : "glass-card hover:border-blue-500/30",
          isCondensed && "p-2 rounded-xl"
        )}
        style={{ 
          borderLeft: completed ? `3px solid ${taskColor}44` : `3px solid ${taskColor}`,
          background: completed ? "rgba(15,23,42,0.4)" : `linear-gradient(135deg, ${taskColor}12 0%, rgba(15,23,42,0.6) 100%)`
        }}
        onClick={() => completeTask(task.id, dateStr)}
      >
        <span 
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-xl text-xl",
            isCondensed ? "w-8 h-8 text-lg" : "w-10 h-10",
            completed ? "bg-slate-800" : `${taskColor}22`
          )}
          style={{ backgroundColor: completed ? "#1e293b" : `${taskColor}22` }}
        >
          {completed ? <Check className="w-4 h-4 text-slate-500" /> : (task.emoji || "📋")}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "block font-bold leading-snug",
              isCondensed ? "text-xs" : "text-sm",
              completed ? "line-through text-slate-500" : "text-slate-100"
            )}>
              {task.title}
            </span>
            {task.time && !isCondensed && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md">
                {task.time}
              </span>
            )}
          </div>
          {hasSubtasks && (
            <div className="flex items-center gap-2 mt-1">
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                  <div 
                    className="h-full bg-blue-500/50 transition-all duration-500" 
                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  />
               </div>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                 {completedSubtasks}/{totalSubtasks}
               </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {hasSubtasks && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-500 hover:text-blue-400 transition-colors"
            >
              <ListTodo className={cn("w-4 h-4 transition-transform", expanded && "text-blue-400")} />
            </button>
          )}
          {!completed && !isCondensed && (
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveTaskUp(task.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button onClick={() => moveTaskDown(task.id)} className="p-1 hover:bg-slate-700/50 rounded text-slate-500 hover:text-blue-400 transition-colors">
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasSubtasks && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={cn("pt-2 pb-1 pr-4 flex flex-col gap-2", isCondensed ? "pl-10" : "pl-12")}>
              {task.subtasks?.map(st => (
                <div 
                  key={st.id} 
                  className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-white/5 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => toggleSubtask(task.id, st.id)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    st.completed ? "bg-blue-600 border-blue-600" : "border-slate-700 bg-slate-950"
                  )}>
                    {st.completed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    st.completed ? "text-slate-500 line-through" : "text-slate-300"
                  )}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { habits, tasks, blocks, daySnapshots, addSnapshotEntry, addTask } = useApp();
  const [view, setView] = useState<'current' | 'schedule'>('current');
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Snapshot Modal state
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotCat, setSnapshotCat] = useState("work");
  const [snapshotDuration, setSnapshotDuration] = useState(15);
  const [snapshotLabel, setSnapshotLabel] = useState("");

  // Quick Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateStr = formatDateToDateString(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const isToday = isSameDay(selectedDate, now);

  // Blocks for today
  const todayBlocks = useMemo(() => {
    return blocks.filter(b => b.isOneTime ? b.specificDate === dateStr : (!b.daysOfWeek || b.daysOfWeek.length === 0 || b.daysOfWeek.includes(dayOfWeek)))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [blocks, dateStr, dayOfWeek]);

  // Tasks for today
  const isTaskForDate = (t: Task) => {
    if (t.specificDate) return t.specificDate === dateStr;
    return t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek);
  };

  const todayTasks = useMemo(() => {
    return tasks.filter(isTaskForDate).sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
  }, [tasks, dateStr, dayOfWeek]);

  // Handle Snapshot Submit
  const handleSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel) return;
    const cat = CATEGORIES.find(c => c.id === snapshotCat);
    addSnapshotEntry(dateStr, {
      id: nanoid(),
      startTime: currentMin - snapshotDuration, // default to ending now
      duration: snapshotDuration,
      label: snapshotLabel,
      category: snapshotCat,
      color: cat?.color || "#3b82f6"
    });
    setShowSnapshotModal(false);
    setSnapshotLabel("");
    setSnapshotDuration(15);
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    addTask({
      id: nanoid(),
      title: taskTitle,
      emoji: "📋",
      color: "#6366f1",
      daysOfWeek: [],
      specificDate: dateStr,
      time: taskTime || undefined,
      isAllDay: !taskTime,
      completedDates: {},
      coins: 5,
    });
    setTaskTitle("");
    setTaskTime("");
  };

  const trackedStats = useMemo(() => {
    const snapshots = daySnapshots[dateStr] || [];
    const total = snapshots.reduce((acc, entry) => acc + entry.duration, 0);
    const byCategory: Record<string, number> = {};
    snapshots.forEach(s => {
      if (s.category) {
        byCategory[s.category] = (byCategory[s.category] || 0) + s.duration;
      }
    });
    return { total, byCategory };
  }, [daySnapshots, dateStr]);

  // Current active block (only if looking at today)
  const activeBlock = isToday ? getCurrentBlock(todayBlocks, now) : null;
  const activeBlockColor = getBlockColor(activeBlock) || "#3b82f6";
  const activeBlockHabits = activeBlock ? habits.filter(h => h.blockId === activeBlock.id && h.daysOfWeek.includes(dayOfWeek)) : [];
  const activeBlockTasks = activeBlock ? todayTasks.filter(t => t.blockId === activeBlock.id) : [];

  const allDayHabits = habits.filter(h => (!h.blockId || h.blockId === "general") && (h.daysOfWeek.length === 0 || h.daysOfWeek.includes(dayOfWeek)));

  let blockProgress = 0;
  if (activeBlock?.startTime && activeBlock?.endTime && isToday) {
    const startM = timeToMinutes(activeBlock.startTime);
    const endM = timeToMinutes(activeBlock.endTime);
    if (endM > startM) {
      blockProgress = Math.min(100, Math.max(0, ((currentMin - startM) / (endM - startM)) * 100));
    }
  }

  return (
    <div className="flex flex-col min-h-screen transition-all duration-700 relative overflow-hidden bg-background">
      {/* Background Glow */}
      {view === 'current' && activeBlockColor && activeBlock && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] blur-[120px] opacity-20 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${activeBlockColor} 0%, transparent 70%)` }}
        />
      )}

      {/* Header with Calendar */}
      <div className="nav-blur pb-4 pt-2 flex flex-col gap-2 relative z-10">
        <Calendar selectedDate={selectedDate} onDateChange={(d) => setSelectedDate(d)} />
        
        {view === 'current' ? (
          <div className="px-6 flex justify-center">
            <button 
              onClick={() => setView('schedule')}
              className="bg-slate-900 border border-white/10 hover:bg-slate-800 hover:border-white/20 transition-all text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-blue-400" /> Расписание
            </button>
          </div>
        ) : (
          <div className="px-6 flex justify-between items-center">
            <button 
              onClick={() => setView('current')}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-bold text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
            <span className="font-black text-white uppercase tracking-widest text-sm">Расписание</span>
            <div className="w-16" /> {/* Spacer */}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-20 relative z-10">
        
        {view === 'current' && (
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 mt-6">
            <AnimatePresence mode="wait">
              {activeBlock ? (
                <motion.div 
                  key="active-block"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full glass-card rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
                  style={{ 
                    borderLeft: `6px solid ${activeBlockColor}`,
                    background: `linear-gradient(135deg, ${activeBlockColor}15 0%, rgba(15,23,42,0.6) 100%)`
                  }}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <LayoutGrid className="w-48 h-48" style={{ color: activeBlockColor }} />
                  </div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div>
                      <h1 className="text-4xl font-black text-white mb-2 tracking-tight">{activeBlock.name}</h1>
                      <div className="flex items-center gap-2 text-lg font-bold" style={{ color: activeBlockColor }}>
                        <Clock className="w-5 h-5" />
                        <span>{formatTime(activeBlock.startTime)} — {formatTime(activeBlock.endTime)}</span>
                      </div>
                    </div>
                    {activeBlock.systemUrl && (
                      <button onClick={() => window.open(activeBlock.systemUrl, "_blank")} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg border border-white/5">
                        <ExternalLink className="w-6 h-6" />
                      </button>
                    )}
                  </div>

                  {blockProgress > 0 && isToday && (
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Прогресс блока</span>
                        <span style={{ color: activeBlockColor }}>{Math.round(blockProgress)}%</span>
                      </div>
                      <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${blockProgress}%` }}
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{ 
                            background: `linear-gradient(to right, ${activeBlockColor}, #fff)`,
                            boxShadow: `0 0 20px ${activeBlockColor}50`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-4 opacity-60">
                        <LayoutGrid className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">Привычки</h3>
                      </div>
                      <div className="space-y-3">
                        {activeBlockHabits.length > 0 ? (
                          activeBlockHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)
                        ) : (
                          <div className="py-6 text-center text-xs uppercase tracking-widest font-bold text-slate-500 bg-black/20 rounded-2xl border border-dashed border-white/5">Нет привычек</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-4 opacity-60">
                        <ListTodo className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-100">Задачи</h3>
                      </div>
                      <div className="space-y-3">
                        {activeBlockTasks.length > 0 ? (
                          activeBlockTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)
                        ) : (
                          <div className="py-6 text-center text-xs uppercase tracking-widest font-bold text-slate-500 bg-black/20 rounded-2xl border border-dashed border-white/5">Нет задач</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="free-time"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-32 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center text-5xl mb-6 shadow-2xl border border-white/5">
                    🌊
                  </div>
                  <h2 className="text-4xl font-black text-slate-200 mb-2 tracking-tight">Свободное время</h2>
                  <p className="text-slate-500 font-medium">Блоков на это время нет. Отдыхайте!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* All-day habits below the block */}
            {allDayHabits.length > 0 && (
              <div className="w-full max-w-4xl mt-8">
                <div className="flex items-center gap-2 mb-4 opacity-60 px-2">
                  <LayoutGrid className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-100">Привычки на весь день</h3>
                </div>
                <div className="space-y-3">
                  {allDayHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'schedule' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6"
          >
            
            {/* Left Column: Timeline of Blocks */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-800/60 pb-12">
              <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-slate-900 border-4 border-slate-700 shadow-lg" />
              
              {todayBlocks.length > 0 ? todayBlocks.map((block, idx) => {
                const blockColor = getBlockColor(block) || "#3b82f6";
                const blockHabits = habits.filter(h => h.blockId === block.id && h.daysOfWeek.includes(dayOfWeek));
                
                // Determine if there is a gap before this block
                const prevBlock = idx > 0 ? todayBlocks[idx - 1] : null;
                const gapMinutes = prevBlock ? Math.max(0, timeToMinutes(block.startTime) - timeToMinutes(prevBlock.endTime)) : 0;
                const hasGap = gapMinutes > 0;

                return (
                  <div key={block.id}>
                    {hasGap && (
                      <div className="flex flex-col items-center justify-center opacity-50 transition-all" style={{ height: `${Math.max(60, gapMinutes)}px` }}>
                        <div className="w-px h-full bg-slate-800 border-l border-dashed border-slate-700" />
                        <span className="absolute text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 -translate-x-[11px] sm:-translate-x-[15px]">
                          {gapMinutes >= 60 ? `${Math.floor(gapMinutes/60)}ч ${gapMinutes%60}м` : `${gapMinutes}м`} перерыв
                        </span>
                      </div>
                    )}
                    
                    <div className="relative mb-8 group">
                      {/* Timeline dot */}
                      <div 
                        className="absolute top-6 -left-[35px] sm:-left-[43px] w-4 h-4 rounded-full border-2 bg-slate-950 z-10 transition-transform group-hover:scale-125"
                        style={{ borderColor: blockColor }}
                      />
                      
                      <div className="glass-card rounded-[32px] p-5 shadow-sm border border-white/5 transition-all hover:bg-slate-900/60"
                        style={{ borderLeft: `4px solid ${blockColor}` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-black text-white mb-1">{block.name}</h3>
                            <p className="text-xs font-bold" style={{ color: blockColor }}>
                              {formatTime(block.startTime)} — {formatTime(block.endTime)}
                            </p>
                          </div>
                          {block.systemUrl && (
                            <button onClick={() => window.open(block.systemUrl, "_blank")} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        {blockHabits.length > 0 ? (
                          <div className="space-y-2 mt-4">
                            {blockHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic mt-2">Нет привычек</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 px-4">
                  <p className="text-slate-500 font-bold text-center">Блоков нет</p>
                </div>
              )}
              
              <div className="absolute bottom-0 -left-[11px] w-5 h-5 rounded-full bg-slate-900 border-4 border-slate-700 shadow-lg" />
            </div>

            {/* Right Column: Snapshot & Tasks */}
            <div className="flex flex-col gap-8">
              
              {/* Слепок дня (Snapshot Widget) */}
              <div className="glass-card rounded-[32px] p-6 border border-white/5 bg-slate-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Target className="w-32 h-32 text-purple-400 rotate-12" />
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-black text-white tracking-tight">Слепок дня</h2>
                </div>

                <div className="mb-4 flex items-baseline gap-2 relative z-10">
                  <span className="text-4xl font-black text-white">{trackedStats.total}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">минут отслежено</span>
                </div>

                {Object.keys(trackedStats.byCategory).length > 0 && (
                  <div className="mb-6 space-y-2 relative z-10">
                    {Object.entries(trackedStats.byCategory).sort((a, b) => b[1] - a[1]).map(([catId, duration]) => {
                      const cat = CATEGORIES.find(c => c.id === catId);
                      if (!cat) return null;
                      return (
                        <div key={catId} className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-xl border border-white/5">
                          <div className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span className="text-xs font-bold text-slate-300">{cat.label}</span>
                          </div>
                          <span className="text-xs font-black" style={{ color: cat.color }}>{duration} мин</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 relative z-10">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSnapshotCat(cat.id); setShowSnapshotModal(true); }}
                      className="px-3 py-2 rounded-xl border border-white/5 bg-black/40 hover:bg-white/10 transition-all flex items-center gap-2 text-xs font-bold text-slate-300"
                    >
                      <span>{cat.icon}</span> {cat.label} <Plus className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Лента дел (Timeline of Tasks) */}
              <div className="glass-card rounded-[32px] p-5 border border-white/5 bg-slate-900/40 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <ListTodo className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-black text-white tracking-tight">Лента дел</h2>
                </div>

                <div className="space-y-2 mb-6 flex-1 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {todayTasks.length > 0 ? todayTasks.map(task => (
                    <TaskRow key={task.id} task={task} dateStr={dateStr} />
                  )) : (
                    <p className="text-xs text-slate-500 italic text-center py-8">Нет задач на сегодня</p>
                  )}
                </div>

                <form onSubmit={handleTaskSubmit} className="flex gap-2 shrink-0 pt-4 border-t border-white/5">
                  <input
                    type="time"
                    value={taskTime}
                    onChange={e => setTaskTime(e.target.value)}
                    className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Новая задача..."
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 text-sm font-bold"
                  />
                  <button type="submit" disabled={!taskTitle} className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>

          </motion.div>
        )}
      </div>

      <FormModal title="Добавить время" isOpen={showSnapshotModal} onClose={() => setShowSnapshotModal(false)} onSubmit={handleSnapshotSubmit} submitText="Сохранить">
         <div className="flex items-center gap-3 mb-6 p-4 bg-slate-900 rounded-2xl border border-white/5">
           <span className="text-2xl">{CATEGORIES.find(c => c.id === snapshotCat)?.icon}</span>
           <span className="font-bold text-white">{CATEGORIES.find(c => c.id === snapshotCat)?.label}</span>
         </div>
         <FormInput label="Что вы делали?" value={snapshotLabel} onChange={setSnapshotLabel} placeholder="Учил английский..." />
         <div className="mt-4">
           <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 pl-1">Длительность</label>
           <div className="flex flex-wrap gap-2">
             {[10, 15, 20, 30, 45, 60, 90, 120].map(dur => (
               <button 
                 key={dur} type="button"
                 onClick={() => setSnapshotDuration(dur)}
                 className={cn(
                   "px-4 py-2 rounded-xl border font-black text-xs transition-all",
                   snapshotDuration === dur 
                     ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                     : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/10"
                 )}
               >
                 {dur}м
               </button>
             ))}
           </div>
         </div>
      </FormModal>
    </div>
  );
}
