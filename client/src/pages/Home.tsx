import { useState, useEffect, useMemo } from "react";
import { useApp, Habit, Task, HabitBlock, getTodayDateString, SnapshotEntry } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus, ArrowUp, ArrowDown, LayoutGrid, ListTodo, ExternalLink, Calendar as CalendarIcon, Target, X } from "lucide-react";
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
  const { habits, tasks, blocks, daySnapshots, addSnapshotEntry, addTask, updateTask } = useApp();
  const [, setLocation] = useLocation();
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

  // Get total tracked time today
  const totalTrackedMinutes = useMemo(() => {
    return (daySnapshots[dateStr] || []).reduce((acc, entry) => acc + entry.duration, 0);
  }, [daySnapshots, dateStr]);

  return (
    <div className="flex flex-col min-h-screen transition-all duration-700 relative overflow-hidden bg-background">
      {/* Header with Calendar */}
      <div className="nav-blur pb-4 pt-2">
        <Calendar selectedDate={selectedDate} onDateChange={(d) => setSelectedDate(d)} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          
          {/* Left Column: Schedule (Расписание) */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-black text-white tracking-tight">Расписание</h2>
            </div>
            
            <div className="space-y-4">
              {todayBlocks.length > 0 ? todayBlocks.map(block => {
                const blockColor = getBlockColor(block) || "#3b82f6";
                const blockHabits = habits.filter(h => h.blockId === block.id && h.daysOfWeek.includes(dayOfWeek));
                
                return (
                  <div key={block.id} className="glass-card rounded-[32px] p-5 shadow-sm border border-white/5 relative overflow-hidden"
                    style={{ borderLeft: `4px solid ${blockColor}` }}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <LayoutGrid className="w-24 h-24" style={{ color: blockColor }} />
                    </div>
                    <div className="flex items-start justify-between mb-4 relative z-10">
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
                      <div className="space-y-2 mt-4 relative z-10">
                        {blockHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-2">Нет привычек</p>
                    )}
                  </div>
                );
              }) : (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                  <p className="text-slate-500 font-bold">На сегодня блоков нет</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Snapshot & Tasks */}
          <div className="flex flex-col gap-8">
            
            {/* Слепок дня (Snapshot Widget) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-purple-500" />
                  <h2 className="text-xl font-black text-white tracking-tight">Слепок дня</h2>
                </div>
                <button onClick={() => setLocation("/snapshot")} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                  Полная статистика &rarr;
                </button>
              </div>

              <div className="glass-card rounded-[32px] p-6 border border-white/5 bg-slate-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Target className="w-32 h-32 text-purple-400 rotate-12" />
                </div>
                <div className="mb-4 flex items-baseline gap-2 relative z-10">
                  <span className="text-3xl font-black text-white">{totalTrackedMinutes}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">минут отслежено сегодня</span>
                </div>
                
                <div className="flex flex-wrap gap-2 relative z-10">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSnapshotCat(cat.id); setShowSnapshotModal(true); }}
                      className="px-3 py-2 rounded-xl border border-white/5 bg-black/20 hover:bg-white/10 transition-all flex items-center gap-2 text-xs font-bold text-slate-300"
                    >
                      <span>{cat.icon}</span> {cat.label} <Plus className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Лента дел (Timeline of Tasks) */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ListTodo className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-xl font-black text-white tracking-tight">Лента дел</h2>
                </div>
              </div>

              <div className="glass-card rounded-[32px] p-5 border border-white/5 bg-slate-900/40 flex flex-col h-full">
                <div className="space-y-2 mb-6 flex-1 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {todayTasks.length > 0 ? todayTasks.map(task => (
                    <TaskRow key={task.id} task={task} dateStr={dateStr} />
                  )) : (
                    <p className="text-xs text-slate-500 italic text-center py-4">Нет задач на сегодня</p>
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

          </div>
        </div>
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
