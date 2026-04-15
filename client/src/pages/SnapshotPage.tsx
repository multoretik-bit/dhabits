import React, { useState, useMemo } from "react";
import { useApp, SnapshotEntry, getTodayDateString, FOLDER_COLORS, HabitBlock } from "@/contexts/AppContext";
// Triggering redeploy for categorization features
import { ChevronLeft, Copy, ClipboardPaste, Plus, Trash2, Clock, Calendar as CalendarIcon, ArrowRight, Layout, Check, Palette } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";

const CATEGORIES = [
  { id: "work", label: "Работа", icon: "💼", color: "#ff0000" },
  { id: "study", label: "Учёба", icon: "📚", color: "#ffff00" },
  { id: "productive", label: "Продуктивное", icon: "🧠", color: "#8100eb" },
  { id: "sport", label: "Спорт", icon: "🏃", color: "#0000ff" },
  { id: "useless", label: "Бесполезное", icon: "😴", color: "#94a3b8" },
  { id: "home", label: "Быт", icon: "🏠", color: "#06b6d4" },
  { id: "rest", label: "Отдых", icon: "🧘", color: "#fe8181" },
];

function formatMinutes(mins: number): string {
  mins = mins % 1440; // wrap around for midnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinutes(t: string | undefined): number {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

export default function SnapshotPage() {
  const { 
    blocks, 
    daySnapshots, 
    addSnapshotEntry, 
    updateSnapshotEntry, 
    deleteSnapshotEntry,
    wakeUpTimes
  } = useApp();
  
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [clipboard, setClipboard] = useState<{ label: string; duration: number; color?: string; category?: string } | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<SnapshotEntry | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [durationInput, setDurationInput] = useState(10);
  const [colorInput, setColorInput] = useState("#3b82f6");
  const [categoryInput, setCategoryInput] = useState<string>("work");

  const entries = daySnapshots[selectedDate] || [];
  const wakeUpTime = wakeUpTimes[selectedDate];
  const dayOfWeek = (new Date(selectedDate)).getDay();

  // Filter blocks for today
  const dailyBlocks = useMemo(() => {
    return blocks.filter((b) => !b.daysOfWeek || b.daysOfWeek.length === 0 || b.daysOfWeek.includes(dayOfWeek));
  }, [blocks, dayOfWeek]);

  // Range: 08:00 (480) to 00:00 (1440)
  const START_TIME = 480;
  const END_TIME = 1440;
  const SLOT_SIZE = 10;

  const slots = useMemo(() => {
    const s = [];
    for (let i = START_TIME; i < END_TIME; i += SLOT_SIZE) {
      const entry = entries.find(e => i >= e.startTime && i < e.startTime + e.duration);
      
      // Find plan block for this slot
      const planBlock = dailyBlocks.find(b => {
        const startM = timeToMinutes(b.startTime);
        const endM = timeToMinutes(b.endTime);
        return i >= startM && i < endM;
      });

      s.push({ time: i, entry, planBlock });
    }
    return s;
  }, [entries, dailyBlocks]);

  const handleSaveEntry = () => {
    if (!labelInput) return;
    
    if (editingEntry) {
      updateSnapshotEntry(selectedDate, editingEntry.id, {
        label: labelInput,
        duration: durationInput,
        color: colorInput,
        category: categoryInput
      });
    } else if (activeSlot !== null) {
      const entry: SnapshotEntry = {
        id: Math.random().toString(36).substring(7),
        startTime: activeSlot,
        duration: durationInput,
        label: labelInput,
        color: colorInput,
        category: categoryInput
      };
      addSnapshotEntry(selectedDate, entry);
    }
    
    setActiveSlot(null);
    setEditingEntry(null);
    setLabelInput("");
  };

  const startEdit = (entry: SnapshotEntry) => {
    setEditingEntry(entry);
    setLabelInput(entry.label);
    setDurationInput(entry.duration);
    setColorInput(entry.color || "#3b82f6");
    setCategoryInput(entry.category || "work");
  };
  const pasteEntry = (startTime: number) => {
    if (!clipboard) return;
    addSnapshotEntry(selectedDate, {
      id: Math.random().toString(36).substring(7),
      startTime,
      duration: clipboard.duration,
      label: clipboard.label,
      color: clipboard.color,
      category: clipboard.category
    });
  };

  const copyEntry = (entry: SnapshotEntry) => {
    setClipboard({ label: entry.label, duration: entry.duration, color: entry.color, category: entry.category });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight">Слепок дня</h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <CalendarIcon className="w-3 h-3" />
              {selectedDate}
            </div>
          </div>
        </div>
        
        {wakeUpTime && (
          <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-black text-blue-100 italic">Подъем: {wakeUpTime}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden items-center">
        <div className="w-full max-w-5xl flex flex-col gap-4 min-h-0 bg-slate-900/40 rounded-[40px] border border-white/5 p-4 md:p-8 backdrop-blur-sm">
          
          {/* Header Row */}
          <div className="grid grid-cols-[60px_1fr_1fr] md:grid-cols-[80px_1fr_1fr] gap-4 mb-4 px-2">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Время</div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Layout className="w-3 h-3" /> Реальный слепок
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <ArrowRight className="w-3 h-3" /> План дня
            </div>
          </div>

          {/* Grid Container */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent space-y-1">
            {slots.map(({ time, entry, planBlock }, idx) => {
              const isFirstOfBlock = entry && entry.startTime === time;
              const isOccupied = entry && entry.startTime !== time;
              
              // Handle Plan Block rendering: only show name at the start of the block mapping
              const prevSlotPlanBlock = idx > 0 ? slots[idx-1].planBlock : null;
              const isFirstOfPlan = planBlock && planBlock.id !== prevSlotPlanBlock?.id;

              const isWakeUp = wakeUpTime && formatMinutes(time) === wakeUpTime;

              return (
                <div key={time} className="grid grid-cols-[60px_1fr_1fr] md:grid-cols-[80px_1fr_1fr] gap-4 min-h-[52px]">
                  {/* Time Column */}
                  <div className={cn(
                    "text-[10px] font-bold text-right py-4 transition-colors border-r border-white/5 pr-4",
                    isWakeUp ? "text-yellow-400" : "text-slate-600"
                  )}>
                    {formatMinutes(time)}
                  </div>

                  {/* Trace Column */}
                  <div className="relative">
                    {isFirstOfBlock ? (
                      <motion.div 
                        layoutId={entry.id}
                        onClick={() => startEdit(entry)}
                        className="absolute inset-x-0 top-0 z-20 border rounded-2xl p-3 flex items-start justify-between group/entry cursor-pointer overflow-hidden transition-all hover:brightness-110"
                        style={{ 
                          height: `calc(${(entry.duration / SLOT_SIZE) * 52}px + ${(Math.floor(entry.duration / 10) - 1) * 4}px)`,
                          backgroundColor: `${entry.color}20`,
                          borderColor: `${entry.color}60`,
                          boxShadow: `0 8px 24px -12px ${entry.color}80`
                        }}
                      >
                         <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: entry.color }} />
                         <div className="min-w-0 pr-2">
                            <div className="text-sm font-black text-white truncate">{entry.label}</div>
                            <div className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">
                              {entry.duration} мин {entry.category && <span> · {CATEGORIES.find(c => c.id === entry.category)?.label}</span>}
                            </div>
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => copyEntry(entry)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteSnapshotEntry(selectedDate, entry.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </motion.div>
                    ) : !isOccupied && (
                      <div className="flex items-center h-full gap-2">
                        <button 
                          onClick={() => setActiveSlot(time)}
                          className="flex-1 h-10 border border-dashed border-white/5 hover:border-white/10 hover:bg-white/5 rounded-xl transition-all flex items-center justify-center text-slate-800 hover:text-slate-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        {clipboard && (
                         <button 
                           onClick={() => pasteEntry(time)}
                           className="w-10 h-10 border border-dashed border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/20 rounded-xl transition-all flex items-center justify-center text-blue-400"
                         >
                           <ClipboardPaste className="w-4 h-4" />
                         </button>
                       )}
                      </div>
                    )}
                  </div>

                  {/* Plan Column */}
                  <div className="relative">
                    {planBlock && (
                      <div className={cn(
                        "h-full px-4 flex items-center border-l-2 transition-all",
                         isFirstOfPlan ? "bg-white/5 rounded-t-xl mt-1 pt-1" : "bg-white/2"
                      )}
                      style={{ borderLeftColor: planBlock.color || "#475569" }}
                      >
                        {isFirstOfPlan && (
                          <span className="text-xs font-bold text-slate-400 truncate py-1">
                            {planBlock.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Summary Row */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
              <Check className="w-4 h-4" /> Сводка по дню
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
               {CATEGORIES.map(cat => {
                 const total = entries.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.duration, 0);
                 if (total === 0) return null;
                 return (
                   <div key={cat.id} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>{cat.icon}</span>
                        {cat.label}
                      </div>
                      <div className="text-xl font-black text-white">
                        {total} <span className="text-xs font-bold text-slate-500">мин</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                         <div 
                           className="h-full" 
                           style={{ 
                             backgroundColor: cat.color,
                             width: `${Math.min(100, (total / 1440) * 100 * 5)}%` // scaled for visibility
                           }} 
                         />
                      </div>
                   </div>
                 );
               })}
               {entries.length === 0 && (
                 <div className="col-span-full text-center py-4 text-slate-600 text-xs italic">
                    Заполните слепок дня, чтобы увидеть статистику
                 </div>
               )}
            </div>
          </div>
        </div>
      </main>

      {/* Entry Modal */}
      <AnimatePresence>
        {(activeSlot !== null || editingEntry !== null) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setActiveSlot(null);
                setEditingEntry(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-950 border border-white/10 rounded-[40px] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-white mb-6">
                {editingEntry ? `Изменить: ${editingEntry.label}` : `Что вы делали в ${formatMinutes(activeSlot!)}?`}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 pl-1">Занятие</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    placeholder="Напр: Завтрак, Работа..."
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 pl-1">Категория</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => {
                          setCategoryInput(cat.id);
                          // Suggest a default color if user hasn't picked one yet or is editing
                          if (!editingEntry) setColorInput(cat.color);
                        }}
                        className={cn(
                          "py-3 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                          categoryInput === cat.id 
                            ? "bg-slate-800 border-white/20 text-white shadow-lg shadow-white/5" 
                            : "bg-slate-950 border-white/5 text-slate-500 hover:border-white/10"
                        )}
                        style={categoryInput === cat.id ? { borderColor: `${cat.color}60` } : {}}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 pl-1">Длительность</label>
                  <div className="flex flex-wrap gap-2">
                    {[10, 20, 30, 40, 50, 60, 90, 120].map(dur => (
                      <button 
                        key={dur}
                        onClick={() => setDurationInput(dur)}
                        className={cn(
                          "px-4 py-2 rounded-xl border font-black text-xs transition-all",
                          durationInput === dur 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                            : "bg-slate-950 border-white/5 text-slate-400 hover:border-white/10"
                        )}
                      >
                        {dur}м
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2 pl-1">Цвет</label>
                   <AdvancedColorPicker value={colorInput} onChange={setColorInput} />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setActiveSlot(null);
                      setEditingEntry(null);
                    }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold transition-all"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleSaveEntry}
                    disabled={!labelInput}
                    className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black transition-all shadow-xl shadow-blue-500/20"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
