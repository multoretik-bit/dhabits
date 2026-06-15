import { useState, useEffect, useMemo } from "react";
import { useApp, Habit, Task, HabitBlock, getTodayDateString, SnapshotEntry, getCurrentBlock } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus, ArrowUp, ArrowDown, LayoutGrid, ListTodo, ExternalLink, Target, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import HabitRow from "@/components/HabitRow";
import Calendar from "@/components/Calendar";
import TaskRow from "@/components/TaskRow";
import TaskCalendarFeed from "@/components/TaskCalendarFeed";
import { formatDateToDateString, isSameDay } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import FormModal from "@/components/FormModal";
import EmojiPicker from "@/components/EmojiPicker";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import { FormCheckbox } from "@/components/FormInputs";
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
const DAYS_OF_WEEK = [
  { id: 1, label: "Пн" },
  { id: 2, label: "Вт" },
  { id: 3, label: "Ср" },
  { id: 4, label: "Чт" },
  { id: 5, label: "Пт" },
  { id: 6, label: "Сб" },
  { id: 0, label: "Вс" },
];

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((d) => d !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS_OF_WEEK.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => toggle(d.id)}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
            ${value.includes(d.id) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}


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
  // Quick Task form state (now full task state)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskEmoji, setTaskEmoji] = useState("📋");
  const [taskColor, setTaskColor] = useState("#3b82f6");
  const [taskBlockId, setTaskBlockId] = useState("");
  const [taskDays, setTaskDays] = useState<number[]>([]);
  const [taskIsAllDay, setTaskIsAllDay] = useState(true);
  const [taskCoins, setTaskCoins] = useState("5");
  const [taskIsOneTime, setTaskIsOneTime] = useState(false);
  const [taskSpecificDate, setTaskSpecificDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [dayTab, setDayTab] = useState<'habits' | 'tasks' | 'plans'>('habits');

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
    return blocks.filter(b => b.isOneTime ? b.specificDate === dateStr : (b.daysOfWeek && b.daysOfWeek.includes(dayOfWeek)))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [blocks, dateStr, dayOfWeek]);

  // Tasks for today
  const isTaskForDate = (t: Task) => {
    if (t.specificDate) return t.specificDate === dateStr;
    return t.daysOfWeek && t.daysOfWeek.includes(dayOfWeek);
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
    if (!taskTitle.trim()) return;
    addTask({
      id: nanoid(),
      title: taskTitle,
      emoji: taskEmoji,
      color: taskColor,
      blockId: taskBlockId || undefined,
      daysOfWeek: taskDays,
      specificDate: taskSpecificDate || undefined,
      time: taskTime || undefined,
      isAllDay: taskIsAllDay,
      completedDates: {},
      coins: Number(taskCoins),
      isOneTime: taskIsOneTime
    });
    setTaskTitle("");
    setTaskTime("");
    setTaskEmoji("📋");
    setTaskColor("#3b82f6");
    setTaskBlockId("");
    setTaskDays([]);
    setTaskIsAllDay(true);
    setTaskCoins("5");
    setTaskIsOneTime(false);
    setTaskSpecificDate("");
    setShowTaskModal(false);
  };

  const openTaskModalForDate = (dateToSet: string) => {
    setTaskSpecificDate(dateToSet);
    setTaskDays([]);
    setTaskIsOneTime(true); // By default when picking specific date, make it one-time
    setShowTaskModal(true);
  };
  
  const TaskForm = () => (
    <>
      <FormInput label="Название задачи" value={taskTitle} onChange={setTaskTitle} placeholder="например, Выпить воду" />
      <EmojiPicker label="Эмодзи" value={taskEmoji} onChange={setTaskEmoji} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Цвет</label>
        <AdvancedColorPicker value={taskColor} onChange={setTaskColor} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Блок (опционально)</label>
        <select value={taskBlockId} onChange={(e) => setTaskBlockId(e.target.value)}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">— Без блока —</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{b.startTime ? ` (${b.startTime}–${b.endTime})` : ""}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Дни недели (пусто = каждый день)</label>
        <DayPicker value={taskDays} onChange={setTaskDays} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Конкретная дата (опционально)</label>
        <input 
          type="date" 
          value={taskSpecificDate} 
          onChange={(e) => setTaskSpecificDate(e.target.value)} 
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent" 
        />
      </div>
      <FormInput label="Время (опционально)" value={taskTime} onChange={setTaskTime} type="time" />
      <FormCheckbox label="Задача на весь день (показывать без привязки к блоку)" checked={taskIsAllDay} onChange={setTaskIsAllDay} />
      <FormInput label="Монет за выполнение" value={taskCoins} onChange={setTaskCoins} type="number" />
      <div className="pt-2 border-t border-border mt-2">
        <FormCheckbox label="Одноразовая (исчезнет после выполнения)" checked={taskIsOneTime} onChange={setTaskIsOneTime} />
      </div>
    </>
  );

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

  const allDayHabits = habits.filter(h => (!h.blockId || h.blockId === "general") && (h.daysOfWeek && h.daysOfWeek.includes(dayOfWeek)));

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

            {/* All-day habits and tasks below the block */}
               <div className="flex gap-2 mb-6 bg-slate-900/40 p-1 rounded-xl w-fit">
                 <button onClick={() => setDayTab('habits')} className={`px-4 py-2 rounded-lg text-sm font-bold ${dayTab === 'habits' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Привычки на день</button>
                 <button onClick={() => setDayTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-bold ${dayTab === 'tasks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Задачи на день</button>
                 <button onClick={() => setDayTab('plans')} className={`px-4 py-2 rounded-lg text-sm font-bold ${dayTab === 'plans' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Планы</button>
               </div>
               
               {dayTab === 'habits' && (
                  <div className="space-y-3">
                    {allDayHabits.length > 0 ? allDayHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />) : <div className="py-6 text-center text-xs uppercase tracking-widest font-bold text-slate-500 bg-black/20 rounded-2xl border border-dashed border-white/5">Нет привычек на весь день</div>}
                  </div>
               )}
               {dayTab === 'tasks' && (
                  <div className="space-y-3">
                    {todayTasks.filter(t => !t.blockId).length > 0 ? todayTasks.filter(t => !t.blockId).map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />) : <div className="py-6 text-center text-xs uppercase tracking-widest font-bold text-slate-500 bg-black/20 rounded-2xl border border-dashed border-white/5">Нет задач на весь день</div>}
                  </div>
               )}
               {dayTab === 'plans' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {blocks.filter(b => b.systemUrl).length > 0 ? blocks.filter(b => b.systemUrl).map(b => {
                      const bColor = getBlockColor(b) || "#3b82f6";
                      return (
                        <a key={b.id} href={b.systemUrl} target="_blank" rel="noopener noreferrer" className="glass-card rounded-[24px] p-5 shadow-sm border border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl group" style={{ borderLeft: `4px solid ${bColor}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-white">{b.name}</h3>
                            <ExternalLink className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: bColor }} />
                          </div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Перейти к плану</p>
                        </a>
                      );
                    }) : <div className="py-6 text-center text-xs uppercase tracking-widest font-bold text-slate-500 bg-black/20 rounded-2xl border border-dashed border-white/5 col-span-full">Нет планов</div>}
                  </div>
               )}
            </div>
          </div>
        )}

        {view === 'schedule' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6 px-4"
          >
            
            {/* Left Column: Timeline of Blocks */}
            <div className="lg:col-span-7 relative pl-6 sm:pl-8 border-l-2 border-slate-800/60 pb-12">
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

            <div className="lg:col-span-5 flex flex-col gap-8">
              
              {/* Слепок дня (Snapshot Widget) */}
              <div className="glass-card rounded-[32px] p-8 border border-white/5 bg-slate-900/40 relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Target className="w-32 h-32 text-purple-400 rotate-12" />
                </div>
                
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h2 className="text-xl font-black text-white tracking-tight">Слепок дня</h2>
                </div>

                <div className="max-h-[600px] overflow-y-auto pr-2 no-scrollbar space-y-6">
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-4xl font-black text-white">{trackedStats.total}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">минут отслежено</span>
                  </div>

                  {Object.keys(trackedStats.byCategory).length > 0 && (
                    <div className="space-y-2 relative z-10">
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
                  
                  <div className="grid grid-cols-2 gap-2 relative z-10 pb-4">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setSnapshotCat(cat.id); setShowSnapshotModal(true); }}
                        className="px-3 py-3 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/10 transition-all flex items-center justify-between gap-2 text-xs font-bold text-slate-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                        <Plus className="w-4 h-4 opacity-30" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Лента дел (Timeline of Tasks) */}
              <div className="flex flex-col h-full mt-4 lg:mt-0 relative z-10">
                <div className="flex items-center justify-between mb-6 px-2 bg-slate-900/60 py-3 rounded-2xl border border-white/5 backdrop-blur-md sticky top-0 z-20 shadow-lg">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-xl font-black text-white tracking-tight">Календарь задач</h2>
                  </div>
                  <button onClick={() => openTaskModalForDate(dateStr)} className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl transition-colors font-bold flex items-center justify-center gap-1 text-xs uppercase tracking-widest">
                    <Plus className="w-4 h-4" /> Добавить
                  </button>
                </div>

                <div className="flex-1">
                  <TaskCalendarFeed onCreateTask={openTaskModalForDate} daysCount={30} />
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </div>

      <FormModal title="Новая задача" isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSubmit={handleTaskSubmit} submitText="Создать">
        <TaskForm />
      </FormModal>

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
