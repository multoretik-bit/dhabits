import React, { useState, useMemo } from "react";
import { useApp, SnapshotEntry, getTodayDateString } from "@/contexts/AppContext";
import { ChevronLeft, Copy, ClipboardPaste, Plus, Trash2, Clock, Calendar as CalendarIcon, ArrowRight, Layout } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Timeline from "@/components/Timeline";

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
  const [clipboard, setClipboard] = useState<{ label: string; duration: number; color?: string } | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<SnapshotEntry | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [durationInput, setDurationInput] = useState(10);

  const entries = daySnapshots[selectedDate] || [];
  const wakeUpTime = wakeUpTimes[selectedDate];

  // Generate 144 slots of 10 minutes
  const slots = useMemo(() => {
    const s = [];
    for (let i = 0; i < 1440; i += 10) {
      const entry = entries.find(e => i >= e.startTime && i < e.startTime + e.duration);
      s.push({ time: i, entry });
    }
    return s;
  }, [entries]);

  const handleSaveEntry = () => {
    if (!labelInput) return;
    
    if (editingEntry) {
      updateSnapshotEntry(selectedDate, editingEntry.id, {
        label: labelInput,
        duration: durationInput
      });
    } else if (activeSlot !== null) {
      const entry: SnapshotEntry = {
        id: Math.random().toString(36).substring(7),
        startTime: activeSlot,
        duration: durationInput,
        label: labelInput,
        color: "#3b82f6" // default blue
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
  };

  const copyEntry = (entry: SnapshotEntry) => {
    setClipboard({ label: entry.label, duration: entry.duration, color: entry.color });
  };

  const pasteEntry = (startTime: number) => {
    if (!clipboard) return;
    addSnapshotEntry(selectedDate, {
      id: Math.random().toString(36).substring(7),
      startTime,
      duration: clipboard.duration,
      label: clipboard.label,
      color: clipboard.color
    });
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

      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 overflow-hidden">
        {/* Left Side: Real Trace */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Layout className="w-4 h-4" /> Реальный слепок
            </h2>
            {clipboard && (
              <div className="text-[10px] bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full font-bold border border-blue-500/30">
                Буфер: {clipboard.label} ({clipboard.duration}м)
              </div>
            )}
          </div>

          <div className="flex-1 bg-slate-900/40 rounded-[32px] border border-white/5 overflow-y-auto p-4 scrollbar-hide space-y-1">
            {slots.map(({ time, entry }, idx) => {
              // Only render the start of entry to avoid duplicates in the 10-min slot list
              if (entry && entry.startTime !== time) return null;

              const isWakeUp = wakeUpTime && formatMinutes(time) === wakeUpTime;

              return (
                <div key={time} className="relative group flex gap-4">
                  <div className={cn(
                    "w-12 text-[10px] font-bold text-right py-2 transition-colors",
                    isWakeUp ? "text-yellow-400" : "text-slate-600 group-hover:text-slate-400"
                  )}>
                    {formatMinutes(time)}
                  </div>

                  {entry ? (
                    <motion.div 
                      layoutId={entry.id}
                      onClick={() => startEdit(entry)}
                      className="flex-1 bg-blue-600/20 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between group/entry cursor-pointer hover:bg-blue-600/30 transition-colors"
                      style={{ minHeight: (entry.duration / 10) * 44 }}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{entry.label}</div>
                        <div className="text-[10px] font-medium text-blue-300/60 uppercase tracking-tighter">
                          {formatMinutes(entry.startTime)} — {formatMinutes(entry.startTime + entry.duration)} ({entry.duration} м)
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => copyEntry(entry)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => deleteSnapshotEntry(selectedDate, entry.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex gap-2">
                       <button 
                         onClick={() => setActiveSlot(time)}
                         className="flex-1 h-10 border border-dashed border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl transition-all flex items-center justify-center text-slate-700 hover:text-blue-400"
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
              );
            })}
          </div>
        </div>

        {/* Right Side: Plan */}
        <div className="w-full md:w-80 flex flex-col gap-4 min-h-0">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
             План дня <ArrowRight className="w-4 h-4" />
          </h2>
          <div className="flex-1">
            <Timeline 
              blocks={blocks} 
              selectedDate={new Date(selectedDate)}
            />
          </div>
        </div>
      </main>

      {/* Entry Modal/Overlay */}
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
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-white mb-6">
                {editingEntry ? `Изменить: ${editingEntry.label}` : `Что вы делали в ${formatMinutes(activeSlot!)}?`}
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Занятие</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    placeholder="Напр: Завтрак, Работа..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Длительность</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 30, 60].map(dur => (
                      <button 
                        key={dur}
                        onClick={() => setDurationInput(dur)}
                        className={cn(
                          "py-3 rounded-xl border font-black text-sm transition-all",
                          durationInput === dur 
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        )}
                      >
                        {dur} м
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      setActiveSlot(null);
                      setEditingEntry(null);
                    }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black transition-all"
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
