const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/pages/Home.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add imports for DayPicker, EmojiPicker, AdvancedColorPicker
if (!content.includes('EmojiPicker')) {
  content = content.replace(
    /import FormModal from "@\/components\/FormModal";/,
    `import FormModal from "@/components/FormModal";\nimport EmojiPicker from "@/components/EmojiPicker";\nimport AdvancedColorPicker from "@/components/AdvancedColorPicker";\nimport { FormCheckbox } from "@/components/FormInputs";`
  );
}

// Add DayPicker definition if it doesn't exist
if (!content.includes('function DayPicker')) {
  const categoriesRegex = /const CATEGORIES = \[[\s\S]*?\];/;
  const categoriesMatch = content.match(categoriesRegex);
  if (categoriesMatch) {
    const dayPickerCode = `\nconst DAYS_OF_WEEK = [
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
          className={\`px-3 py-1 rounded-lg text-sm font-medium transition-colors
            \${value.includes(d.id) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}\`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}\n`;
    content = content.replace(categoriesRegex, categoriesMatch[0] + dayPickerCode);
  }
}

// Replace the simple task form state and add full task form state
content = content.replace(
  /const \[taskTitle, setTaskTitle\] = useState\(""\);\n  const \[taskTime, setTaskTime\] = useState\(""\);/,
  `// Quick Task form state (now full task state)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskEmoji, setTaskEmoji] = useState("📋");
  const [taskColor, setTaskColor] = useState("#3b82f6");
  const [taskBlockId, setTaskBlockId] = useState("");
  const [taskDays, setTaskDays] = useState<number[]>([]);
  const [taskIsAllDay, setTaskIsAllDay] = useState(true);
  const [taskCoins, setTaskCoins] = useState("5");
  const [taskIsOneTime, setTaskIsOneTime] = useState(false);
  const [taskTime, setTaskTime] = useState("");
  const [dayTab, setDayTab] = useState<'habits' | 'tasks'>('habits');`
);

// Replace handleTaskSubmit
content = content.replace(
  /const handleTaskSubmit = \(e: React.FormEvent\) => \{[\s\S]*?\};/,
  `const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask({
      id: nanoid(),
      title: taskTitle,
      emoji: taskEmoji,
      color: taskColor,
      blockId: taskBlockId || undefined,
      daysOfWeek: taskDays,
      specificDate: dateStr,
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
    setShowTaskModal(false);
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
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{b.startTime ? \` (\${b.startTime}–\${b.endTime})\` : ""}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Дни недели (пусто = каждый день)</label>
        <DayPicker value={taskDays} onChange={setTaskDays} />
      </div>
      <FormInput label="Время (опционально)" value={taskTime} onChange={setTaskTime} type="time" />
      <FormCheckbox label="Задача на весь день (показывать без привязки к блоку)" checked={taskIsAllDay} onChange={setTaskIsAllDay} />
      <FormInput label="Монет за выполнение" value={taskCoins} onChange={setTaskCoins} type="number" />
      <div className="pt-2 border-t border-border mt-2">
        <FormCheckbox label="Одноразовая (исчезнет после выполнения)" checked={taskIsOneTime} onChange={setTaskIsOneTime} />
      </div>
    </>
  );`
);

// Replace current day habits/tasks
const currentDayHabitsRegex = /\{\/\* All-day habits below the block \*\/\}[\s\S]*?\{\/\* Лента дел \(Timeline of Tasks\) \*\/\}/;

let daySectionReplacement = `{/* All-day habits and tasks below the block */}
            <div className="w-full max-w-4xl mt-8">
               <div className="flex gap-2 mb-6 bg-slate-900/40 p-1 rounded-xl w-fit">
                 <button onClick={() => setDayTab('habits')} className={\`px-4 py-2 rounded-lg text-sm font-bold \${dayTab === 'habits' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}\`}>Привычки на день</button>
                 <button onClick={() => setDayTab('tasks')} className={\`px-4 py-2 rounded-lg text-sm font-bold \${dayTab === 'tasks' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}\`}>Задачи на день</button>
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
                      <div className="flex flex-col items-center justify-center opacity-50 transition-all" style={{ height: \`\${Math.max(60, gapMinutes)}px\` }}>
                        <div className="w-px h-full bg-slate-800 border-l border-dashed border-slate-700" />
                        <span className="absolute text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 -translate-x-[11px] sm:-translate-x-[15px]">
                          {gapMinutes >= 60 ? \`\${Math.floor(gapMinutes/60)}ч \${gapMinutes%60}м\` : \`\${gapMinutes}м\`} перерыв
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
                        style={{ borderLeft: \`4px solid \${blockColor}\` }}
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

              {/* Лента дел (Timeline of Tasks) */}`;

content = content.replace(currentDayHabitsRegex, daySectionReplacement);

// Fix timeline of tasks
const timelineRegex = /<div className="space-y-2 mb-6 flex-1 max-h-\[400px\] overflow-y-auto pr-2 no-scrollbar">[\s\S]*?<\/form>\n              <\/div>/;

const newTimeline = `<div className="space-y-2 mb-6 flex-1 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {tasks.length > 0 ? tasks.map(task => (
                    <TaskRow key={task.id} task={task} dateStr={dateStr} />
                  )) : (
                    <p className="text-xs text-slate-500 italic text-center py-8">Нет задач</p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button onClick={() => setShowTaskModal(true)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20 font-bold flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Создать задачу
                  </button>
                </div>
              </div>`;

content = content.replace(timelineRegex, newTimeline);

// Add Task Modal at the bottom
const modalRegex = /<FormModal title="Добавить время"/;
const newModals = `<FormModal title="Новая задача" isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} onSubmit={handleTaskSubmit} submitText="Создать">
        <TaskForm />
      </FormModal>

      <FormModal title="Добавить время"`;

content = content.replace(modalRegex, newModals);

fs.writeFileSync(file, content);
console.log('Fixed Home.tsx!');
