import { useState, useEffect, useMemo } from "react";
import { useApp, Habit, Task, HabitBlock, getTodayDateString, SnapshotEntry, getCurrentBlock } from "@/contexts/AppContext";
import { Clock, Check, Plus, Minus, ArrowUp, ArrowDown, LayoutGrid, ListTodo, ExternalLink, Target, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import HabitRow from "@/components/HabitRow";
import Calendar from "@/components/Calendar";
import SmallMonthCalendar from "@/components/SmallMonthCalendar";
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
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] blur-[140px] opacity-[0.12] pointer-events-none transition-all duration-1000"
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
              className="bg-secondary/70 border border-orange-300/10 hover:bg-secondary hover:border-orange-300/20 transition-all text-white font-bold uppercase tracking-wide text-xs px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 active:scale-95"
            >
              <Clock className="w-4 h-4 text-orange-300" /> Расписание
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
                  className="w-full glass-card-lg rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
                  style={{
                    borderLeft: `3px solid ${activeBlockColor}`,
                    background: `linear-gradient(135deg, ${activeBlockColor}12 0%, rgba(36,26,48,0.55) 100%)`
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
                    <div className="flex items-center gap-2">
                      {activeBlock.systemUrl && (
                        <button onClick={() => window.open(activeBlock.systemUrl, "_blank")} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg border border-white/5" title="План">
                          <ExternalLink className="w-6 h-6" />
                        </button>
                      )}
                      {activeBlock.plans?.map(plan => (
                        <button key={plan.id} onClick={() => window.open(plan.url, "_blank")} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shadow-lg border border-white/5" title={plan.name}>
                          <ExternalLink className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {blockProgress > 0 && isToday && (
                    <div className="space-y-3 mb-8">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Прогресс блока</span>
                        <span style={{ color: activeBlockColor }}>{Math.round(blockProgress)}%</span>
                      </div>
                      <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${blockProgress}%` }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{
                            background: `linear-gradient(to right, ${activeBlockColor}99, ${activeBlockColor})`,
                            boxShadow: `0 0 16px ${activeBlockColor}60`
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
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-5xl mb-6 shadow-2xl border border-orange-200/10">
                    🌊
                  </div>
                  <h2 className="text-4xl font-black text-slate-200 mb-2 tracking-tight">Свободное время</h2>
                  <p className="text-slate-500 font-medium">Блоков на это время нет. Отдыхайте!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* All-day habits and tasks below the block */}
            <div className="w-full max-w-4xl mt-8">
               <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-fit">
                 <button onClick={() => setDayTab('habits')} className={`px-4 py-2 rounded-lg text-sm font-bold ${dayTab === 'habits' ? 'bg-orange-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>Привычки на день</button>
                 <button onClick={() => setDayTab('tasks')} className={`px-4 py-2 rounded-lg text-sm font-bold ${dayTab === 'tasks' ? 'bg-orange-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>Задачи на день</button>
                 <button onClick={() => setDayTab('plans')} className={`px-4 py-2 rounded-lg text-sm font-bold ${dayTab === 'plans' ? 'bg-orange-500/20 text-white' : 'text-slate-400 hover:text-white'}`}>Планы</button>
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
                    {blocks.filter(b => b.systemUrl || (b.plans && b.plans.length > 0)).length > 0 ? blocks.filter(b => b.systemUrl || (b.plans && b.plans.length > 0)).flatMap(b => {
                      const bColor = getBlockColor(b) || "#3b82f6";
                      const renderPlanCard = (url: string, name: string, id: string) => (
                        <a key={id} href={url} target="_blank" rel="noopener noreferrer" className="glass-card rounded-[24px] p-5 shadow-sm border border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl group" style={{ borderLeft: `4px solid ${bColor}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-white">{name}</h3>
                            <ExternalLink className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: bColor }} />
                          </div>
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">{b.name}</p>
                        </a>
                      );
                      
                      const cards = [];
                      if (b.systemUrl) cards.push(renderPlanCard(b.systemUrl, "План", b.id + "_legacy"));
                      if (b.plans) {
                        b.plans.forEach(p => cards.push(renderPlanCard(p.url, p.name || "План", p.id)));
                      }
                      return cards;
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
            <div className="lg:col-span-7 relative pl-6 sm:pl-8 border-l-2 border-orange-200/10 pb-12">
              <div className="absolute top-0 -left-[11px] w-5 h-5 rounded-full bg-white/5 border-4 border-orange-200/10 shadow-lg" />
              
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
                        <div className="w-px h-full bg-orange-200/10 border-l border-dashed border-orange-200/15" />
                        <span className="absolute text-[10px] font-black uppercase tracking-widest text-slate-500 bg-black/30 px-3 py-1 rounded-full border border-orange-200/10 -translate-x-[11px] sm:-translate-x-[15px]">
                          {gapMinutes >= 60 ? `${Math.floor(gapMinutes/60)}ч ${gapMinutes%60}м` : `${gapMinutes}м`} перерыв
                        </span>
                      </div>
                    )}
                    
                    <div className="relative mb-8 group">
                      {/* Timeline dot */}
                      <div 
                        className="absolute top-6 -left-[35px] sm:-left-[43px] w-4 h-4 rounded-full border-2 bg-black/30 z-10 transition-transform group-hover:scale-125"
                        style={{ borderColor: blockColor }}
                      />
                      
                      <div className="glass-card rounded-[32px] p-5 shadow-sm border border-orange-200/5 transition-all hover:-translate-y-0.5"
                        style={{ borderLeft: `4px solid ${blockColor}` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-black text-white mb-1">{block.name}</h3>
                            <p className="text-xs font-bold" style={{ color: blockColor }}>
                              {formatTime(block.startTime)} — {formatTime(block.endTime)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {block.systemUrl && (
                              <button onClick={() => window.open(block.systemUrl, "_blank")} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors" title="План">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            )}
                            {block.plans?.map(plan => (
                              <button key={plan.id} onClick={() => window.open(plan.url, "_blank")} className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors" title={plan.name}>
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
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
              
              <div className="absolute bottom-0 -left-[11px] w-5 h-5 rounded-full bg-white/5 border-4 border-orange-200/10 shadow-lg" />
            </div>

            <div className="lg:col-span-5 flex flex-col gap-8 sticky top-6">
              
              {/* Compact Task Calendar */}
              <div className="glass-card rounded-[32px] p-6 relative flex flex-col h-[840px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-orange-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Задачи на {selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </h2>
                  </div>
                  <button onClick={() => openTaskModalForDate(dateStr)} className="p-2 bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 rounded-xl transition-colors font-bold flex items-center justify-center gap-1 text-xs uppercase tracking-wide active:scale-90">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 min-h-[220px] overflow-y-auto mb-4 space-y-2 pr-2 custom-scrollbar">
                  {todayTasks.length > 0 ? (
                    todayTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} isCondensed />)
                  ) : (
                    <div className="py-6 text-center text-xs uppercase tracking-widest font-bold text-slate-500 bg-black/20 rounded-2xl border border-dashed border-white/5">Нет задач</div>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-white/5">
                  <SmallMonthCalendar selectedDate={selectedDate} onSelectDate={(d) => setSelectedDate(d)} />
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </div>

      <FormModal title="Новая задача" isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSubmit={handleTaskSubmit} submitText="Создать">
        <TaskForm />
      </FormModal>
    </div>
  );
}
