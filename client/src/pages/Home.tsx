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
        {!completed && task.coins && task.coins > 0 && !isCondensed && (
          <div 
            className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl text-center"
            style={{ backgroundColor: `${taskColor}25`, border: `1px solid ${taskColor}40` }}
          >
            <img src="/coin.png" alt="coin" className="w-3 h-3 object-contain mb-0.5" />
            <span className="text-[9px] font-bold text-white leading-tight mt-0.5">{task.coins}</span>
          </div>
        )}

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
          <span className={cn(
            "block font-bold leading-snug",
            isCondensed ? "text-xs" : "text-sm",
            completed ? "line-through text-slate-500" : "text-slate-100"
          )}>
            {task.title}
          </span>
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

function TaskFolderRow({ folder, tasks, dateStr }: { folder: any; tasks: Task[]; dateStr: string }) {
  const { toggleTaskFolderCollapse } = useApp();
  const completedCount = tasks.filter(t => !!(t.completedDates && t.completedDates[dateStr])).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const folderColor = folder.color || "#3b82f6";

  return (
    <div className="mb-6">
      <div 
        className="group relative glass-card rounded-[24px] p-4 overflow-hidden cursor-pointer hover:border-white/10 hover-lift transition-all"
        onClick={() => toggleTaskFolderCollapse(folder.id)}
      >
        <div 
          className="absolute top-0 left-0 w-1 h-full" 
          style={{ backgroundColor: folderColor }} 
        />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl border transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${folderColor}15`, borderColor: `${folderColor}30` }}
            >
              {folder.emoji || "📁"}
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">{folder.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {completedCount} из {totalCount} выполнено
              </p>
            </div>
          </div>
          <div className="text-right">
             <span className="text-xs font-black text-blue-400" style={{ color: folderColor }}>{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-0 left-0 h-full rounded-full"
            style={{ 
              backgroundColor: folderColor,
              boxShadow: `0 0 10px ${folderColor}40`
            }}
          />
        </div>

        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
           {folder.collapsed ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
        </div>
      </div>

      <AnimatePresence>
        {!folder.collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pl-4 space-y-1 border-l-2 border-slate-800/30 ml-5">
               {tasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} isCondensed={true} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default function Home() {
  const { habits, tasks, taskFolders, blocks, wakeUpTimes, setWakeUpTime } = useApp();
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
  const blockIds = new Set(blocks.map(b => b.id));
  const allDayHabits = habits.filter(
    h => (!h.blockId || !blockIds.has(h.blockId)) && h.daysOfWeek.includes(dayOfWeek)
  );

  // New filtering for tasks including specific date
  const isTaskForDate = (t: Task) => {
    if (t.specificDate) return t.specificDate === dateStr;
    return t.daysOfWeek.length === 0 || t.daysOfWeek.includes(dayOfWeek);
  };

  const blockTasks = detailedBlock
    ? tasks.filter(t => t.blockId === detailedBlock.id && isTaskForDate(t))
    : [];

  const allDayTasks = tasks.filter(
    t => t.isAllDay && isTaskForDate(t)
  );

  // Group allDayTasks by folder
  const groupedTasks = useMemo(() => {
    const foldersWithTasks: { folder: any; tasks: Task[] }[] = [];
    const standaloneTasks: Task[] = [];

    // Filter tasks for today
    const activeTasks = tasks.filter(t => isTaskForDate(t));
    
    // Group active tasks
    activeTasks.forEach(task => {
      if (task.folderId && task.folderId !== "general") {
        const folder = taskFolders.find(f => f.id === task.folderId);
        if (folder) {
          let folderGroup = foldersWithTasks.find(g => g.folder.id === folder.id);
          if (!folderGroup) {
            folderGroup = { folder, tasks: [] };
            foldersWithTasks.push(folderGroup);
          }
          folderGroup.tasks.push(task);
        } else {
          standaloneTasks.push(task);
        }
      } else {
        standaloneTasks.push(task);
      }
    });

    // Sort folders by global taskFolders order
    foldersWithTasks.sort((a, b) => {
       const idxA = taskFolders.findIndex(f => f.id === a.folder.id);
       const idxB = taskFolders.findIndex(f => f.id === b.folder.id);
       return idxA - idxB;
    });

    return { foldersWithTasks, standaloneTasks };
  }, [tasks, taskFolders, dateStr, dayOfWeek]);

  // Daily Completion Stats (Only Habits)
  const dailyScheduledHabits = habits.filter(h => h.daysOfWeek.includes(dayOfWeek));
  const dailyCompletedHabits = dailyScheduledHabits.filter(h => !!(h.completedDates && h.completedDates[dateStr]));
  const completionPercentage = dailyScheduledHabits.length > 0 
    ? (dailyCompletedHabits.length / dailyScheduledHabits.length) * 100 
    : 0;

  const blockColor = getBlockColor(detailedBlock);

  return (
    <div 
      className="flex flex-col min-h-screen transition-all duration-700 relative overflow-hidden bg-background"
    >
      {/* Background Glow */}
      {blockColor && (detailedBlock || activeBlock) && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] blur-[120px] opacity-20 pointer-events-none transition-all duration-1000"
          style={{ background: `radial-gradient(circle, ${blockColor} 0%, transparent 70%)` }}
        />
      )}

      {/* Header with Calendar */}
      <div className="nav-blur pb-4 pt-2">
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
                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:bg-card/60"
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
                    ? "text-primary-foreground shadow-lg"
                    : "bg-card/40 border-border text-muted-foreground hover:text-foreground hover:bg-card/60"
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

          {/* Only All-day Habits here now */}
          {(allDayHabits.length > 0) && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[1px] flex-1 bg-white/5" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Daily Habits</h3>
                <div className="h-[1px] flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                {allDayHabits.map(h => <HabitRow key={h.id} habit={h} dateStr={dateStr} hideUnitTracker={true} />)}
              </div>
            </div>
          )}

          {/* Dedicated Daily Tasks Section at the bottom */}
          <div className="mt-12 pb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <ListTodo className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Задачи на день</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Личные цели и разовые дела</p>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent ml-4" />
            </div>

            {groupedTasks.foldersWithTasks.length > 0 || groupedTasks.standaloneTasks.length > 0 ? (
              <div className="space-y-4">
                {/* Render Folders first */}
                {groupedTasks.foldersWithTasks.map(group => (
                  <TaskFolderRow 
                    key={group.folder.id} 
                    folder={group.folder} 
                    tasks={group.tasks} 
                    dateStr={dateStr} 
                  />
                ))}
                
                {/* Render Standalone Tasks */}
                {groupedTasks.standaloneTasks.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
                    {groupedTasks.standaloneTasks.map(t => <TaskRow key={t.id} task={t} dateStr={dateStr} />)}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-white/5 rounded-[32px] text-center">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-xl mb-3 opacity-50">✨</div>
                <p className="text-sm font-bold text-slate-600">На сегодня задач нет</p>
                <button 
                  onClick={() => setLocation("/add")}
                  className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  + Добавить задачу
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
