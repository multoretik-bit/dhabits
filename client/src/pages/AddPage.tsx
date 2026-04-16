import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, FolderPlus, ListChecks, Target, Layers, Check, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from "lucide-react";
import { useApp, Habit, HabitFolder, Task, Goal, GoalFolder } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput, FormCheckbox } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import HabitUnitTracker from "@/components/HabitUnitTracker";
import { nanoid } from "nanoid";

const DAYS_OF_WEEK = [
  { id: 1, label: "Пн" }, { id: 2, label: "Вт" }, { id: 3, label: "Ср" },
  { id: 4, label: "Чт" }, { id: 5, label: "Пт" }, { id: 6, label: "Сб" }, { id: 0, label: "Вс" },
];

type Tab = "habits" | "tasks" | "goals" | "blocks";

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((d) => d !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS_OF_WEEK.map((d) => (
        <button
          key={d.id} type="button" onClick={() => toggle(d.id)}
          className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors
            ${value.includes(d.id) ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

// ─── REUSABLE CARD COMPONENTS ─────────────────────────────────────────────

function UnifiedCoinBadge({ coins, color, label }: { coins: number; color: string; label?: string }) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl text-center shadow-sm"
      style={{ backgroundColor: `${color}25`, border: `1px solid ${color}40` }}
    >
      <img src="/coin.png" alt="coin" className="w-3.5 h-3.5 object-contain mb-0.5" />
      <span className="text-[10px] font-bold text-white leading-tight mt-0.5">{coins}{label ? `/${label}` : ''}</span>
    </div>
  );
}

// ─── HABITS ───────────────────────────────────────────────────────────────
function HabitsTab() {
  const { habits, habitFolders, blocks, addHabit, updateHabit, deleteHabit, addHabitFolder, updateHabitFolder, deleteHabitFolder, moveHabitUp, moveHabitDown, moveHabitFolderUp, moveHabitFolderDown, toggleHabitFolderCollapse } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleName = (id: string) => setExpandedItems(p => ({...p, [id]: !p[id]}));

  // Form states
  const [name, setName] = useState(""); const [emoji, setEmoji] = useState("🎯"); const [color, setColor] = useState("#3b82f6");
  const [folder, setFolder] = useState("general"); const [blockId, setBlockId] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); const [coins, setCoins] = useState("5");
  const [initialStreak, setInitialStreak] = useState("0");
  const [unitsTracking, setUnitsTracking] = useState(false); const [progressUnit, setProgressUnit] = useState("units"); const [coinsPerUnit, setCoinsPerUnit] = useState("1");
  const [isOneTime, setIsOneTime] = useState(false);
  const [folderName, setFolderName] = useState(""); const [folderColor, setFolderColor] = useState("#3b82f6"); const [folderEmoji, setFolderEmoji] = useState("📁");

  const resetForm = () => { 
    setName(""); setEmoji("🎯"); setColor("#3b82f6"); setFolder("general"); 
    setBlockId(""); setDays([1, 2, 3, 4, 5]); setCoins("5"); setInitialStreak("0");
    setUnitsTracking(false); setProgressUnit("units"); setCoinsPerUnit("1"); 
    setIsOneTime(false);
  };

  const habitFormContent = (
    <>
      <FormInput label="Название" value={name} onChange={setName} placeholder="Утренняя пробежка" />
      <EmojiPicker label="Эмодзи" value={emoji} onChange={setEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={color} onChange={setColor} /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Папка</label>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          {habitFolders.map(f => <option key={f.id} value={f.id}>{f.emoji || "📁"} {f.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Блок</label>
        <select value={blockId} onChange={(e) => setBlockId(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          <option value="">— На весь день —</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Дни недели</label><DayPicker value={days} onChange={setDays} /></div>
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Монет за вып." value={coins} onChange={setCoins} type="number" />
        <FormInput label="Начальная серия 🔥" value={initialStreak} onChange={setInitialStreak} type="number" placeholder="0" />
      </div>
      <FormCheckbox label="Отслеживать единицы (км, разы...)" checked={unitsTracking} onChange={setUnitsTracking} />
      {unitsTracking && (
        <>
          <FormInput label="Единица измерения" value={progressUnit} onChange={setProgressUnit} placeholder="км, страниц, раз..." />
          <FormInput label="Монет за единицу" value={coinsPerUnit} onChange={setCoinsPerUnit} type="number" placeholder="1" />
        </>
      )}
      <div className="pt-2 border-t border-slate-800/50">
        <FormCheckbox label="Одноразовая (исчезнет после выполнения)" checked={isOneTime} onChange={setIsOneTime} />
      </div>
    </>
  );

  const folderFormContent = (
    <>
      <FormInput label="Название папки" value={folderName} onChange={setFolderName} placeholder="Здоровье" />
      <EmojiPicker label="Эмодзи" value={folderEmoji} onChange={setFolderEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={folderColor} onChange={setFolderColor} /></div>
    </>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex gap-2 justify-end mb-4">
        <Button onClick={() => setShowCreateFolder(true)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl">
          <FolderPlus className="w-4 h-4 mr-2" /> Папка
        </Button>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
          <Plus className="w-4 h-4 mr-2" /> Привычка
        </Button>
      </div>

      <div className="space-y-5">
        {habitFolders.map(f => {
          const fHabits = habits.filter(h => h.folder === f.id);
          return (
            <div key={f.id} className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-sm">
              <div 
                className="flex items-center justify-between px-5 py-3 bg-slate-800/30 border-b border-slate-800/40 cursor-pointer transition-colors hover:bg-slate-800/50"
                onClick={() => toggleHabitFolderCollapse(f.id)}
              >
                <div className="flex items-center gap-3 text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                   {f.emoji || "📁"} {f.name} <span className="text-slate-500 font-medium">({fHabits.length})</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {f.id !== "general" && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => moveHabitFolderUp(f.id)} className="w-7 h-7 text-slate-500 hover:text-blue-400"><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveHabitFolderDown(f.id)} className="w-7 h-7 text-slate-500 hover:text-blue-400"><ArrowDown className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingFolderId(f.id); setFolderName(f.name); setFolderColor(f.color); setFolderEmoji(f.emoji || "📁"); setShowEditFolder(true); }} className="w-7 h-7 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) { habits.filter((h) => h.folder === f.id).forEach((h) => updateHabit(h.id, { folder: "general" })); deleteHabitFolder(f.id); } }} className="w-7 h-7 text-red-400 hover:bg-red-400/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                  <div className="text-slate-500 ml-2">
                    {f.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>
              {!f.collapsed && (
              <div className="p-3 space-y-2">
                {fHabits.length === 0 && <p className="text-xs text-slate-600 text-center py-4 italic">Пусто</p>}
                {fHabits.map(h => (
                  <div 
                    key={h.id} 
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40"
                    style={{ borderLeft: `3px solid ${h.color}` }}
                  >
                    <UnifiedCoinBadge coins={h.coinsPerComplete} color={h.color} />
                    <span 
                      className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${h.color}22` }}
                    >
                      {h.emoji}
                    </span>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleName(h.id)}>
                      <p className={`font-bold text-sm text-slate-100 ${expandedItems[h.id] ? "" : "truncate"}`}>{h.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                        🔥 {h.streak} · {DAYS_OF_WEEK.filter(d => h.daysOfWeek.includes(d.id)).map(d => d.label).join(", ")}
                      </p>
                      {h.unitsTracking && (
                         <div className="mt-2">
                            <HabitUnitTracker habit={h} compact={true} alwaysShow={true} />
                         </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <Button size="icon" variant="ghost" onClick={() => moveHabitUp(h.id)} className="w-6 h-6 text-slate-600 hover:text-blue-400"><ArrowUp className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => moveHabitDown(h.id)} className="w-6 h-6 text-slate-600 hover:text-blue-400"><ArrowDown className="w-3 h-3" /></Button>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => { 
                        setEditingId(h.id); setName(h.name); setEmoji(h.emoji); setColor(h.color); 
                        setFolder(h.folder); setBlockId(h.blockId || ""); setDays(h.daysOfWeek || []); 
                        setCoins(String(h.coinsPerComplete)); setInitialStreak(String(h.streak));
                        setUnitsTracking(h.unitsTracking); setProgressUnit(h.progressUnit || "units");
                        setCoinsPerUnit(String(h.coinsPerUnit || 1));
                        setIsOneTime(!!h.isOneTime);
                        setShowEdit(true); 
                      }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteHabit(h.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          );
        })}
      </div>

      <FormModal title="Новая привычка" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (name) { addHabit({ id: nanoid(), name, emoji, color, folder, blockId, daysOfWeek: days, streak: Number(initialStreak) || 0, coinsPerComplete: Number(coins), completedDates: {}, units: 0, unitsTracking, progressUnit, coinsPerUnit: Number(coinsPerUnit), isOneTime }); setShowCreate(false); resetForm(); } }} submitText="Создать">{habitFormContent}</FormModal>
      <FormModal title="Редактировать" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && name) { updateHabit(editingId, { name, emoji, color, folder, blockId, daysOfWeek: days, coinsPerComplete: Number(coins), streak: Number(initialStreak) || 0, unitsTracking, progressUnit, coinsPerUnit: Number(coinsPerUnit), isOneTime }); setShowEdit(false); resetForm(); } }} submitText="Сохранить">{habitFormContent}</FormModal>
      <FormModal title="Новая папка" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (folderName) { addHabitFolder({ id: nanoid(), name: folderName, emoji: folderEmoji, color: folderColor, collapsed: false }); setShowCreateFolder(false); setFolderName(""); } }} submitText="Создать">{folderFormContent}</FormModal>
      <FormModal title="Редактировать папку" isOpen={showEditFolder} onClose={() => { setShowEditFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (editingFolderId && folderName) { updateHabitFolder(editingFolderId, { name: folderName, color: folderColor, emoji: folderEmoji }); setShowEditFolder(false); } }} submitText="Сохранить">{folderFormContent}</FormModal>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────
function TasksTab() {
  const { tasks, taskFolders, blocks, addTask, updateTask, deleteTask, addTaskFolder, updateTaskFolder, deleteTaskFolder, toggleTaskFolderCollapse, moveTaskUp, moveTaskDown, moveTaskFolderUp, moveTaskFolderDown } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleName = (id: string) => setExpandedItems(p => ({...p, [id]: !p[id]}));

  const [title, setTitle] = useState(""); const [emoji, setEmoji] = useState("📋");
  const [color, setColor] = useState("#3b82f6");
  const [blockId, setBlockId] = useState(""); const [folderId, setFolderId] = useState("general");
  const [days, setDays] = useState<number[]>([]);
  const [coins, setCoins] = useState("5");
  const [isOneTime, setIsOneTime] = useState(false);
  const [specificDate, setSpecificDate] = useState("");
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);

  const [folderName, setFolderName] = useState(""); const [folderColor, setFolderColor] = useState("#3b82f6"); const [folderEmoji, setFolderEmoji] = useState("📁");

  const addSubtaskField = () => setSubtasks([...subtasks, { id: nanoid(), title: "", completed: false }]);
  const updateSubtaskTitle = (id: string, title: string) => setSubtasks(subtasks.map(s => s.id === id ? { ...s, title } : s));
  const removeSubtaskField = (id: string) => setSubtasks(subtasks.filter(s => s.id !== id));

  const resetForm = () => { 
    setTitle(""); setEmoji("📋"); setColor("#3b82f6"); setBlockId(""); setFolderId("general");
    setDays([]); setCoins("5"); setIsOneTime(false); setSpecificDate(""); setSubtasks([]);
  };

  const taskFormContent = (
    <>
      <FormInput label="Название задачи" value={title} onChange={setTitle} />
      <EmojiPicker label="Эмодзи" value={emoji} onChange={setEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={color} onChange={setColor} /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Блок</label>
        <select value={blockId} onChange={(e) => setBlockId(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          <option value="">— На весь день —</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Папка (Большая задача)</label>
        <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          {taskFolders.map(f => <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>)}
        </select>
      </div>
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Дни недели</label><DayPicker value={days} onChange={setDays} /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Конкретная дата (опционально)</label>
        <input 
          type="date" 
          value={specificDate} 
          onChange={(e) => setSpecificDate(e.target.value)} 
          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" 
        />
      </div>
      <FormInput label="Монет за выполнение" value={coins} onChange={setCoins} type="number" />
      
      <div className="space-y-3 mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-200">Подзадачи (микро-задачи)</label>
          <Button type="button" size="sm" onClick={addSubtaskField} variant="outline" className="h-7 px-2 text-[10px] border-slate-700 hover:bg-slate-800">
            <Plus className="w-3 h-3 mr-1" /> Добавить
          </Button>
        </div>
        <div className="space-y-2">
          {subtasks.map((st) => (
            <div key={st.id} className="flex gap-2">
              <input 
                value={st.title} 
                onChange={(e) => updateSubtaskTitle(st.id, e.target.value)} 
                placeholder="Что нужно сделать?"
                className="flex-1 px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs text-white" 
              />
              <Button type="button" size="icon" onClick={() => removeSubtaskField(st.id)} variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {subtasks.length === 0 && <p className="text-[10px] text-slate-600 italic">Нет подзадач</p>}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 mt-2">
        <FormCheckbox label="Одноразовая (исчезнет после выполнения)" checked={isOneTime} onChange={setIsOneTime} />
      </div>
    </>
  );

  const folderFormContent = (
    <>
      <FormInput label="Название большой задачи" value={folderName} onChange={setFolderName} placeholder="Напр. Изучение React" />
      <EmojiPicker label="Эмодзи" value={folderEmoji} onChange={setFolderEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={folderColor} onChange={setFolderColor} /></div>
    </>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex gap-2 justify-end mb-4">
        <Button onClick={() => setShowCreateFolder(true)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl">
          <FolderPlus className="w-4 h-4 mr-2" /> Большая задача
        </Button>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-bold">
          <Plus className="w-4 h-4 mr-2" /> Задача
        </Button>
      </div>

      <div className="space-y-5">
        {taskFolders.map(f => {
          const fTasks = tasks.filter(t => t.folderId === f.id || (!t.folderId && f.id === "general"));
          return (
            <div key={f.id} className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-sm">
              <div 
                className="flex items-center justify-between px-5 py-3 bg-slate-800/30 border-b border-slate-800/40 cursor-pointer transition-colors hover:bg-slate-800/50"
                onClick={() => toggleTaskFolderCollapse(f.id)}
              >
                <div className="flex items-center gap-3 text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                   {f.emoji || "📁"} {f.name} <span className="text-slate-500 font-medium">({fTasks.length})</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {f.id !== "general" && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => moveTaskFolderUp(f.id)} className="w-7 h-7 text-slate-500 hover:text-blue-400"><ArrowUp className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => moveTaskFolderDown(f.id)} className="w-7 h-7 text-slate-500 hover:text-blue-400"><ArrowDown className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditingFolderId(f.id); setFolderName(f.name); setFolderColor(f.color); setFolderEmoji(f.emoji || "📁"); setShowEditFolder(true); }} className="w-7 h-7 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteTaskFolder(f.id); }} className="w-7 h-7 text-red-400 hover:bg-red-400/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </>
                  )}
                  <div className="text-slate-500 ml-2">
                    {f.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>
              {!f.collapsed && (
                <div className="p-3 space-y-2">
                  {fTasks.length === 0 && <p className="text-xs text-slate-600 text-center py-4 italic">Нет задач</p>}
                  {fTasks.map(t => (
                    <div 
                      key={t.id} 
                      className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80"
                      style={{ borderLeft: `3px solid ${t.color || '#3b82f6'}` }}
                    >
                      <span 
                        className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl"
                        style={{ backgroundColor: `${t.color || '#3b82f6'}22` }}
                      >
                        {t.emoji || "📋"}
                      </span>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleName(t.id)}>
                        <p className={`font-bold text-sm text-slate-200 ${expandedItems[t.id] ? "" : "truncate"}`}>{t.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                          {blocks.find(b => b.id === t.blockId)?.name || 'На весь день'}
                          {t.coins ? (
                            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                              {' · '}<img src="/coin.png" alt="coin" className="w-2.5 h-2.5 object-contain inline-block -translate-y-0.5" /> {t.coins}
                            </span>
                          ) : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <div className="flex flex-col gap-0.5 mr-1">
                          <Button size="icon" variant="ghost" onClick={() => moveTaskUp(t.id)} className="w-6 h-6 text-slate-600 hover:text-blue-400"><ArrowUp className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => moveTaskDown(t.id)} className="w-6 h-6 text-slate-600 hover:text-blue-400"><ArrowDown className="w-3 h-3" /></Button>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => { 
                          setEditingId(t.id); setTitle(t.title); setEmoji(t.emoji); setColor(t.color || "#3b82f6"); 
                          setBlockId(t.blockId || ""); setDays(t.daysOfWeek || []); setFolderId(t.folderId || "general");
                          setCoins(String(t.coins || 5)); setIsOneTime(!!t.isOneTime);
                          setSpecificDate(t.specificDate || "");
                          setSubtasks(t.subtasks || []);
                          setShowEdit(true); 
                        }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteTask(t.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <FormModal title="Новая задача" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (title) { addTask({ id: nanoid(), title, emoji, color, blockId: blockId || undefined, folderId: folderId || "general", daysOfWeek: days, specificDate: specificDate || undefined, isAllDay: !blockId, completedDates: {}, coins: Number(coins), isOneTime, subtasks: subtasks.filter(s => s.title.trim() !== "") }); setShowCreate(false); resetForm(); } }} submitText="Создать">{taskFormContent}</FormModal>
      <FormModal title="Редактировать" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && title) { updateTask(editingId, { title, emoji, color, blockId: blockId || undefined, folderId: folderId || "general", daysOfWeek: days, specificDate: specificDate || undefined, isAllDay: !blockId, coins: Number(coins), isOneTime, subtasks: subtasks.filter(s => s.title.trim() !== "") }); setShowEdit(false); resetForm(); } }} submitText="Сохранить">{taskFormContent}</FormModal>
      <FormModal title="Новая большая задача" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (folderName) { addTaskFolder({ id: nanoid(), name: folderName, emoji: folderEmoji, color: folderColor, collapsed: false }); setShowCreateFolder(false); setFolderName(""); } }} submitText="Создать">{folderFormContent}</FormModal>
      <FormModal title="Редактировать большую задачу" isOpen={showEditFolder} onClose={() => { setShowEditFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (editingFolderId && folderName) { updateTaskFolder(editingFolderId, { name: folderName, color: folderColor, emoji: folderEmoji }); setShowEditFolder(false); } }} submitText="Сохранить">{folderFormContent}</FormModal>
    </div>
  );
}

// ─── GOALS ────────────────────────────────────────────────────────────────
function GoalsTab() {
  const { goals, goalFolders, addGoal, updateGoal, deleteGoal, addGoalFolder, updateGoalFolder, deleteGoalFolder, toggleGoalFolderCollapse, moveGoalFolderUp, moveGoalFolderDown } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleName = (id: string) => setExpandedItems(p => ({...p, [id]: !p[id]}));

  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [target, setTarget] = useState("100"); 
  const [color, setColor] = useState("#8b5cf6"); const [emoji, setEmoji] = useState("🎯"); const [folder, setFolder] = useState("general");
  const [coins, setCoins] = useState("100");
  const [deadline, setDeadline] = useState("");

  const [folderName, setFolderName] = useState(""); const [folderColor, setFolderColor] = useState("#8b5cf6"); const [folderEmoji, setFolderEmoji] = useState("🏆");

  const resetForm = () => { setName(""); setDesc(""); setTarget("100"); setColor("#8b5cf6"); setEmoji("🎯"); setFolder("general"); setCoins("100"); setDeadline(""); };

  const goalFormContent = (
    <>
      <FormInput label="Название цели" value={name} onChange={setName} />
      <EmojiPicker label="Иконка (эмодзи)" value={emoji} onChange={setEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={color} onChange={setColor} /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Папка</label>
        <select value={folder} onChange={(e) => setFolder(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          {goalFolders.map(f => <option key={f.id} value={f.id}>{f.emoji || "🏆"} {f.name}</option>)}
        </select>
      </div>
      <FormInput label="Описание (опционально)" value={desc} onChange={setDesc} />
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Цель (значение)" value={target} onChange={setTarget} type="number" />
        <FormInput label="Награда (монеты)" value={coins} onChange={setCoins} type="number" />
      </div>
      <FormInput label="Дедлайн (до какого числа)" value={deadline} onChange={setDeadline} type="date" />
    </>
  );

  const folderFormContent = (
    <>
      <FormInput label="Название папки" value={folderName} onChange={setFolderName} placeholder="Здоровье" />
      <EmojiPicker label="Эмодзи" value={folderEmoji} onChange={setFolderEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={folderColor} onChange={setFolderColor} /></div>
    </>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={() => setShowCreateFolder(true)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl">
          <FolderPlus className="w-4 h-4 mr-2" /> Папка
        </Button>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-bold">
          <Plus className="w-4 h-4 mr-2" /> Цель
        </Button>
      </div>
      
      <div className="space-y-5">
        {goalFolders.map(f => {
          const fGoals = goals.filter(g => g.folder === f.id);
          return (
            <div key={f.id} className="bg-slate-900/40 rounded-3xl border border-slate-800/60 overflow-hidden shadow-sm">
              <div 
                className="flex items-center justify-between px-5 py-3 bg-slate-800/30 border-b border-slate-800/40 cursor-pointer transition-colors hover:bg-slate-800/50"
                onClick={() => toggleGoalFolderCollapse(f.id)}
              >
                <div className="flex items-center gap-3 text-slate-300 font-bold uppercase text-[11px] tracking-wider">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                   {f.emoji || "🏆"} {f.name} <span className="text-slate-500 font-medium">({fGoals.length})</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {f.id !== "general" && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => moveGoalFolderUp(f.id)} className="w-8 h-8 text-slate-500 hover:text-blue-400"><ArrowUp className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => moveGoalFolderDown(f.id)} className="w-8 h-8 text-slate-500 hover:text-blue-400"><ArrowDown className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingFolderId(f.id); setFolderName(f.name); setFolderColor(f.color); setFolderEmoji(f.emoji || "🏆"); setShowEditFolder(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) { goals.filter((g) => g.folder === f.id).forEach((g) => updateGoal(g.id, { folder: "general" })); deleteGoalFolder(f.id); } }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  <div className="text-slate-500 ml-2">
                    {f.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </div>
                </div>
              </div>
              {!f.collapsed && (
              <div className="p-3 space-y-2">
                {fGoals.length === 0 && <p className="text-xs text-slate-600 text-center py-4 italic">Пусто</p>}
                {fGoals.map(g => (
                  <div 
                    key={g.id} 
                    className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40"
                    style={{ borderLeft: `3px solid ${g.color}` }}
                  >
                    <UnifiedCoinBadge coins={g.coins} color={g.color} />
                    <span 
                      className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ backgroundColor: `${g.color}22` }}
                    >
                      {g.emoji}
                    </span>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleName(g.id)}>
                      <p className={`font-bold text-sm text-slate-100 ${expandedItems[g.id] ? "" : "truncate"}`}>{g.name}</p>
                      <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
                        Цель: {g.targetValue} · Сейчас: {g.currentValue}
                        {g.deadline && <span className="ml-2 text-red-400/80">📅 До: {g.deadline}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { 
                        setEditingId(g.id); setName(g.name); setEmoji(g.emoji); setColor(g.color); 
                        setDesc(g.description); setTarget(String(g.targetValue)); setFolder(g.folder);
                        setCoins(String(g.coins)); setDeadline(g.deadline || "");
                        setShowEdit(true); 
                      }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteGoal(g.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          );
        })}
      </div>

      <FormModal title="Новая цель" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (name) { addGoal({ id: nanoid(), name, emoji, description: desc, linkedHabits: [], coins: Number(coins), streak: 0, folder, completed: false, startValue: 0, targetValue: Number(target), currentValue: 0, color, deadline }); setShowCreate(false); resetForm(); } }} submitText="Создать">{goalFormContent}</FormModal>
      <FormModal title="Редактировать" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && name) { updateGoal(editingId, { name, emoji, description: desc, targetValue: Number(target), color, folder, coins: Number(coins), deadline }); setShowEdit(false); resetForm(); } }} submitText="Сохранить">{goalFormContent}</FormModal>
      <FormModal title="Новая папка" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (folderName) { addGoalFolder({ id: nanoid(), name: folderName, emoji: folderEmoji, color: folderColor, collapsed: false }); setShowCreateFolder(false); setFolderName(""); } }} submitText="Создать">{folderFormContent}</FormModal>
      <FormModal title="Редактировать папку" isOpen={showEditFolder} onClose={() => { setShowEditFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (editingFolderId && folderName) { updateGoalFolder(editingFolderId, { name: folderName, color: folderColor, emoji: folderEmoji }); setShowEditFolder(false); } }} submitText="Сохранить">{folderFormContent}</FormModal>
    </div>
  );
}

// ─── BLOCKS ───────────────────────────────────────────────────────────────
function BlocksTab() {
  const { blocks, addBlock, updateBlock, deleteBlock, moveBlockUp, moveBlockDown } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleName = (id: string) => setExpandedItems(p => ({...p, [id]: !p[id]}));

  const [name, setName] = useState(""); const [startTime, setStartTime] = useState("09:00"); const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState("#3b82f6");
  const [systemUrl, setSystemUrl] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  const resetForm = () => { setName(""); setStartTime("09:00"); setEndTime("10:00"); setColor("#3b82f6"); setSystemUrl(""); setDays([1, 2, 3, 4, 5, 6, 0]); };

  const blockFormContent = (
    <>
      <FormInput label="Название блока" value={name} onChange={setName} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Начало</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Конец</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Дни недели</label><DayPicker value={days} onChange={setDays} /></div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Цвет блока</label>
        <AdvancedColorPicker value={color} onChange={setColor} />
      </div>
      <FormInput label="Система (URL — например, ссылка на сайт)" value={systemUrl} onChange={setSystemUrl} placeholder="https://my-education-site.com" />
    </>
  );

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
          <Plus className="w-4 h-4 mr-2" /> Блок
        </Button>
      </div>
      <div className="space-y-3">
        {blocks.map(b => (
          <div key={b.id} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: b.color ? b.color + '25' : (b.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex] + '25' : 'rgba(148, 163, 184, 0.1)') }}>
              <Layers className="w-5 h-5" style={{ color: b.color ? b.color : (b.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex] : "#94a3b8") }} />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleName(b.id)}>
              <p className={`font-bold text-sm text-slate-200 ${expandedItems[b.id] ? "" : "truncate"}`}>{b.name}</p>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                {b.startTime} - {b.endTime} · {(!b.daysOfWeek || b.daysOfWeek.length === 7 || b.daysOfWeek.length === 0) ? "Каждый день" : DAYS_OF_WEEK.filter(d => b.daysOfWeek?.includes(d.id)).map(d => d.label).join(", ")}
                {b.systemUrl && <span className="ml-2 text-blue-400">🔗 Система</span>}
              </p>
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col gap-0.5 mr-1">
                <Button size="icon" variant="ghost" onClick={() => moveBlockUp(b.id)} className="w-6 h-6 text-slate-600 hover:text-blue-400"><ArrowUp className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" onClick={() => moveBlockDown(b.id)} className="w-6 h-6 text-slate-600 hover:text-blue-400"><ArrowDown className="w-3 h-3" /></Button>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setEditingId(b.id); setName(b.name); setStartTime(b.startTime||""); setEndTime(b.endTime||""); setColor(b.color || (b.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex] : "#3b82f6")); setSystemUrl(b.systemUrl || ""); setDays(b.daysOfWeek || [1, 2, 3, 4, 5, 6, 0]); setShowEdit(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteBlock(b.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {blocks.length === 0 && <p className="text-center py-10 text-slate-600 italic">Нет блоков</p>}
      </div>
      <FormModal title="Новый блок" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (name) { addBlock({ id: nanoid(), name, habits: [], collapsed: false, startTime, endTime, color, systemUrl, daysOfWeek: days }); setShowCreate(false); resetForm(); } }} submitText="Создать">{blockFormContent}</FormModal>
      <FormModal title="Редактировать" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && name) { updateBlock(editingId, { name, startTime, endTime, color, systemUrl, daysOfWeek: days }); setShowEdit(false); resetForm(); } }} submitText="Сохранить">{blockFormContent}</FormModal>
    </div>
  );
}

// ─── MAIN HUB ─────────────────────────────────────────────────────────────
export default function AddPage() {
  const [tab, setTab] = useState<Tab>("habits");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "habits", label: "Привычки", icon: <ListChecks className="w-4 h-4" /> },
    { key: "tasks", label: "Задачи", icon: <Plus className="w-4 h-4" /> },
    { key: "goals", label: "Цели", icon: <Target className="w-4 h-4" /> },
    { key: "blocks", label: "Блоки", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="px-5 pt-8 pb-4 min-h-full">
      <h2 className="text-2xl font-extrabold text-white mb-6 tracking-tight">Управление</h2>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900/50 rounded-2xl p-1.5 mb-6 border border-slate-800/80 shadow-inner overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${tab === t.key ? "bg-blue-600 text-white shadow-md shadow-blue-900/50" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pb-10">
        {tab === "habits" && <HabitsTab />}
        {tab === "tasks" && <TasksTab />}
        {tab === "goals" && <GoalsTab />}
        {tab === "blocks" && <BlocksTab />}
      </div>
    </div>
  );
}
