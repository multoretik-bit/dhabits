import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, FolderPlus, ListChecks, Target, Layers } from "lucide-react";
import { useApp, Habit, HabitFolder, Task, Goal, GoalFolder } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput, FormCheckbox } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
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

// ─── HABITS ───────────────────────────────────────────────────────────────
function HabitsTab() {
  const { habits, habitFolders, blocks, addHabit, updateHabit, deleteHabit, addHabitFolder, updateHabitFolder, deleteHabitFolder, moveHabitUp, moveHabitDown, moveHabitFolderUp, moveHabitFolderDown } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  // Form states...
  const [name, setName] = useState(""); const [emoji, setEmoji] = useState("🎯"); const [color, setColor] = useState("#3b82f6");
  const [folder, setFolder] = useState("general"); const [blockId, setBlockId] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]); const [coins, setCoins] = useState("5");
  const [unitsTracking, setUnitsTracking] = useState(false); const [progressUnit, setProgressUnit] = useState("units"); const [coinsPerUnit, setCoinsPerUnit] = useState("1");
  const [folderName, setFolderName] = useState(""); const [folderColor, setFolderColor] = useState("#3b82f6"); const [folderEmoji, setFolderEmoji] = useState("📁");

  const resetForm = () => { setName(""); setEmoji("🎯"); setColor("#3b82f6"); setFolder("general"); setBlockId(""); setDays([1, 2, 3, 4, 5]); setCoins("5"); setUnitsTracking(false); setProgressUnit("units"); setCoinsPerUnit("1"); };

  const HabitForm = () => (
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
      <FormInput label="Монет" value={coins} onChange={setCoins} type="number" />
    </>
  );

  const FolderForm = () => (
    <>
      <FormInput label="Название папки" value={folderName} onChange={setFolderName} placeholder="Здоровье" />
      <EmojiPicker label="Эмодзи" value={folderEmoji} onChange={setFolderEmoji} />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={folderColor} onChange={setFolderColor} /></div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end mb-4">
        <Button onClick={() => setShowCreateFolder(true)} variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800">
          <FolderPlus className="w-4 h-4 mr-2" /> Папка
        </Button>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Привычка
        </Button>
      </div>

      <div className="space-y-3">
        {habitFolders.map(f => {
          const fHabits = habits.filter(h => h.folder === f.id);
          return (
            <div key={f.id} className="bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30">
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  {f.emoji || "📁"} {f.name} <span className="text-slate-500 text-sm">({fHabits.length})</span>
                </div>
                {f.id !== "general" && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingFolderId(f.id); setFolderName(f.name); setFolderColor(f.color); setFolderEmoji(f.emoji || "📁"); setShowEditFolder(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) { habits.filter((h) => h.folder === f.id).forEach((h) => updateHabit(h.id, { folder: "general" })); deleteHabitFolder(f.id); } }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>
              <div className="divide-y divide-slate-800/50">
                {fHabits.map(h => (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-2xl">{h.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-200 truncate">{h.name}</p>
                      <p className="text-xs text-slate-500">Дней: {h.daysOfWeek.length} · Монет: {h.coinsPerComplete}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditingId(h.id); setName(h.name); setEmoji(h.emoji); setColor(h.color); setFolder(h.folder); setBlockId(h.blockId || ""); setDays(h.daysOfWeek); setCoins(String(h.coinsPerComplete)); setShowEdit(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteHabit(h.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <FormModal title="Новая привычка" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (name) { addHabit({ id: nanoid(), name, emoji, color, folder, blockId, daysOfWeek: days, streak: 0, coinsPerComplete: Number(coins), completedDates: {}, units: 0, unitsTracking, progressUnit, coinsPerUnit: Number(coinsPerUnit) }); setShowCreate(false); resetForm(); } }} submitText="Создать"><HabitForm /></FormModal>
      <FormModal title="Редактировать привычку" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && name) { updateHabit(editingId, { name, emoji, color, folder, blockId, daysOfWeek: days, coinsPerComplete: Number(coins) }); setShowEdit(false); } }} submitText="Сохранить"><HabitForm /></FormModal>
      <FormModal title="Новая папка" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (folderName) { addHabitFolder({ id: nanoid(), name: folderName, emoji: folderEmoji, color: folderColor, collapsed: false }); setShowCreateFolder(false); setFolderName(""); } }} submitText="Создать"><FolderForm /></FormModal>
      <FormModal title="Редактировать папку" isOpen={showEditFolder} onClose={() => { setShowEditFolder(false); setFolderName(""); }} onSubmit={(e) => { e.preventDefault(); if (editingFolderId && folderName) { updateHabitFolder(editingFolderId, { name: folderName, color: folderColor, emoji: folderEmoji }); setShowEditFolder(false); } }} submitText="Сохранить"><FolderForm /></FormModal>
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────
function TasksTab() {
  const { tasks, blocks, addTask, updateTask, deleteTask } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState(""); const [emoji, setEmoji] = useState("📋");
  const [blockId, setBlockId] = useState(""); const [days, setDays] = useState<number[]>([]); const [isAllDay, setIsAllDay] = useState(true);

  const resetForm = () => { setTitle(""); setEmoji("📋"); setBlockId(""); setDays([]); setIsAllDay(true); };

  const TaskForm = () => (
    <>
      <FormInput label="Название задачи" value={title} onChange={setTitle} />
      <EmojiPicker label="Эмодзи" value={emoji} onChange={setEmoji} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Блок</label>
        <select value={blockId} onChange={(e) => setBlockId(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          <option value="">— На весь день —</option>
          {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Дни недели (пусто = каждый день)</label><DayPicker value={days} onChange={setDays} /></div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Задача
        </Button>
      </div>
      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <span className="text-2xl">{t.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-200 truncate">{t.title}</p>
              <p className="text-xs text-slate-500">{blocks.find(b => b.id === t.blockId)?.name || 'На весь день'}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditingId(t.id); setTitle(t.title); setEmoji(t.emoji); setBlockId(t.blockId || ""); setDays(t.daysOfWeek); setIsAllDay(t.isAllDay); setShowEdit(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteTask(t.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <FormModal title="Новая задача" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (title) { addTask({ id: nanoid(), title, emoji, blockId: blockId || undefined, daysOfWeek: days, isAllDay: !blockId, completedDates: {} }); setShowCreate(false); resetForm(); } }} submitText="Создать"><TaskForm /></FormModal>
      <FormModal title="Редактировать задачу" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && title) { updateTask(editingId, { title, emoji, blockId: blockId || undefined, daysOfWeek: days, isAllDay: !blockId }); setShowEdit(false); resetForm(); } }} submitText="Сохранить"><TaskForm /></FormModal>
    </div>
  );
}

// ─── GOALS ────────────────────────────────────────────────────────────────
function GoalsTab() {
  const { goals, addGoal, updateGoal, deleteGoal } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [target, setTarget] = useState("100"); const [color, setColor] = useState("#8b5cf6");

  const resetForm = () => { setName(""); setDesc(""); setTarget("100"); setColor("#8b5cf6"); };

  const GoalForm = () => (
    <>
      <FormInput label="Название цели" value={name} onChange={setName} />
      <FormInput label="Описание (опц.)" value={desc} onChange={setDesc} />
      <FormInput label="Целевое значение" value={target} onChange={setTarget} type="number" />
      <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Цвет</label><AdvancedColorPicker value={color} onChange={setColor} /></div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Цель
        </Button>
      </div>
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-200 truncate">{g.name}</p>
              <p className="text-xs text-slate-500">Прогресс: {g.currentValue} / {g.targetValue}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditingId(g.id); setName(g.name); setDesc(g.description); setTarget(String(g.targetValue)); setColor(g.color); setShowEdit(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteGoal(g.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <FormModal title="Новая цель" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (name) { addGoal({ id: nanoid(), name, description: desc, linkedHabits: [], coins: 100, streak: 0, folder: "general", completed: false, startValue: 0, targetValue: Number(target), currentValue: 0, color }); setShowCreate(false); resetForm(); } }} submitText="Создать"><GoalForm /></FormModal>
      <FormModal title="Редактировать цель" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && name) { updateGoal(editingId, { name, description: desc, targetValue: Number(target), color }); setShowEdit(false); resetForm(); } }} submitText="Сохранить"><GoalForm /></FormModal>
    </div>
  );
}

// ─── BLOCKS ───────────────────────────────────────────────────────────────
function BlocksTab() {
  const { blocks, addBlock, updateBlock, deleteBlock } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState(""); const [startTime, setStartTime] = useState("09:00"); const [endTime, setEndTime] = useState("10:00");

  const resetForm = () => { setName(""); setStartTime("09:00"); setEndTime("10:00"); };

  const BlockForm = () => (
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
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Блок
        </Button>
      </div>
      <div className="space-y-3">
        {blocks.map(b => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 rounded-2xl border border-slate-800/80">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-200 truncate">{b.name}</p>
              <p className="text-xs text-slate-500">{b.startTime} - {b.endTime}</p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditingId(b.id); setName(b.name); setStartTime(b.startTime||""); setEndTime(b.endTime||""); setShowEdit(true); }} className="w-8 h-8 text-blue-400 hover:bg-blue-400/10"><Edit2 className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { if (confirm("Удалить?")) deleteBlock(b.id); }} className="w-8 h-8 text-red-400 hover:bg-red-400/10"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <FormModal title="Новый блок" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (name) { addBlock({ id: nanoid(), name, habits: [], collapsed: false, startTime, endTime }); setShowCreate(false); resetForm(); } }} submitText="Создать"><BlockForm /></FormModal>
      <FormModal title="Редактировать блок" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={(e) => { e.preventDefault(); if (editingId && name) { updateBlock(editingId, { name, startTime, endTime }); setShowEdit(false); resetForm(); } }} submitText="Сохранить"><BlockForm /></FormModal>
    </div>
  );
}

// ─── MAIN HUB ─────────────────────────────────────────────────────────────
export default function AddPage() {
  const [tab, setTab] = useState<Tab>("habits");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "habits", label: "Привычки", icon: <ListChecks className="w-4 h-4" /> },
    { key: "tasks", label: "Задачи", icon: <ListChecks className="w-4 h-4" /> },
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

      {tab === "habits" && <HabitsTab />}
      {tab === "tasks" && <TasksTab />}
      {tab === "goals" && <GoalsTab />}
      {tab === "blocks" && <BlocksTab />}
    </div>
  );
}
