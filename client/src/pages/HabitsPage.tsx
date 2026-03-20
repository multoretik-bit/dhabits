import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, FolderPlus, Clock, Layers, ListChecks } from "lucide-react";
import { useApp, Habit, HabitFolder, Task } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput, FormCheckbox } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import { nanoid } from "nanoid";

const DAYS_OF_WEEK = [
  { id: 1, label: "Пн" },
  { id: 2, label: "Вт" },
  { id: 3, label: "Ср" },
  { id: 4, label: "Чт" },
  { id: 5, label: "Пт" },
  { id: 6, label: "Сб" },
  { id: 0, label: "Вс" },
];

type Tab = "habits" | "tasks" | "blocks";

// ─── DayPicker ─────────────────────────────────────────────────────────────
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

// ─── HabitsTab ─────────────────────────────────────────────────────────────
function HabitsTab() {
  const {
    habits, habitFolders, blocks,
    addHabit, updateHabit, deleteHabit,
    addHabitFolder, updateHabitFolder, deleteHabitFolder,
    moveHabitUp, moveHabitDown, moveHabitFolderUp, moveHabitFolderDown,
  } = useApp();

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

  // Habit form
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [color, setColor] = useState("#6366f1");
  const [folder, setFolder] = useState("general");
  const [blockId, setBlockId] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [coins, setCoins] = useState("5");
  const [unitsTracking, setUnitsTracking] = useState(false);
  const [progressUnit, setProgressUnit] = useState("units");
  const [coinsPerUnit, setCoinsPerUnit] = useState("1");
  const [isOneTime, setIsOneTime] = useState(false);

  // Folder form
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#6366f1");
  const [folderEmoji, setFolderEmoji] = useState("📁");
  const resetForm = () => {
    setName(""); setEmoji("🎯"); setColor("#6366f1"); setFolder("general");
    setBlockId(""); setDays([1, 2, 3, 4, 5]); setCoins("5");
    setUnitsTracking(false); setProgressUnit("units"); setCoinsPerUnit("1");
    setIsOneTime(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit({
      id: nanoid(), name, emoji, color, folder, blockId,
      daysOfWeek: days, streak: 0,
      coinsPerComplete: parseFloat(coins) || 5,
      completedDates: {}, units: 0,
      coinsPerUnit: parseFloat(coinsPerUnit) || 1,
      progressUnit, unitsTracking, isOneTime,
    });
    resetForm(); setShowCreate(false);
  };

  const handleOpenEdit = (h: Habit) => {
    setEditingId(h.id); setName(h.name); setEmoji(h.emoji); setColor(h.color);
    setFolder(h.folder); setBlockId(h.blockId || ""); setDays(h.daysOfWeek);
    setCoins(String(h.coinsPerComplete)); setUnitsTracking(h.unitsTracking);
    setProgressUnit(h.progressUnit || "units"); setCoinsPerUnit(String(h.coinsPerUnit || 1));
    setIsOneTime(!!h.isOneTime);
    setShowEdit(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    updateHabit(editingId, {
      name, emoji, color, folder, blockId, daysOfWeek: days,
      coinsPerComplete: parseFloat(coins) || 5,
      unitsTracking, progressUnit, coinsPerUnit: parseFloat(coinsPerUnit) || 1,
      isOneTime,
    });
    setShowEdit(false); resetForm();
  };

  const HabitForm = () => (
    <>
      <FormInput label="Название" value={name} onChange={setName} placeholder="например, Утренняя пробежка" />
      <EmojiPicker label="Эмодзи" value={emoji} onChange={setEmoji} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Цвет</label>
        <AdvancedColorPicker value={color} onChange={setColor} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Папка</label>
        <select value={folder} onChange={(e) => setFolder(e.target.value)}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
          {habitFolders.map((f) => <option key={f.id} value={f.id}>{f.emoji || "📁"} {f.name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Блок (опционально)</label>
        <select value={blockId} onChange={(e) => setBlockId(e.target.value)}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">— Без блока (на весь день) —</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{b.startTime ? ` (${b.startTime}–${b.endTime})` : ""}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Дни недели</label>
        <DayPicker value={days} onChange={setDays} />
      </div>
      <FormInput label="Монет за выполнение" value={coins} onChange={setCoins} type="number" placeholder="5" />
      <FormCheckbox label="Отслеживать единицы (км, страниц, подходов)" checked={unitsTracking} onChange={setUnitsTracking} />
      {unitsTracking && (
        <>
          <FormInput label="Единица измерения" value={progressUnit} onChange={setProgressUnit} placeholder="км, страниц..." />
          <FormInput label="Монет за единицу" value={coinsPerUnit} onChange={setCoinsPerUnit} type="number" placeholder="1" />
        </>
      )}
      <div className="pt-2 border-t border-border mt-2">
        <FormCheckbox label="Одноразовая (исчезнет после выполнения)" checked={isOneTime} onChange={setIsOneTime} />
      </div>
    </>
  );

  const FolderForm = () => (
    <>
      <FormInput label="Название папки" value={folderName} onChange={setFolderName} placeholder="Здоровье, Работа..." />
      <EmojiPicker label="Эмодзи" value={folderEmoji} onChange={setFolderEmoji} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Цвет</label>
        <AdvancedColorPicker value={folderColor} onChange={setFolderColor} />
      </div>
    </>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateFolder(true)} variant="outline" size="sm" className="gap-1">
            <FolderPlus className="w-4 h-4" /> Папка
          </Button>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1 bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4" /> Привычка
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {habitFolders.map((f) => {
          const fHabits = habits.filter((h) => h.folder === f.id);
          return (
            <div key={f.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-secondary">
                <div className="flex items-center gap-2">
                  <button onClick={() => updateHabitFolder(f.id, { collapsed: !f.collapsed })} className="text-muted-foreground">
                    {f.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <span>{f.emoji || "📁"}</span>
                  <span className="font-semibold text-sm text-foreground">{f.name}</span>
                  <span className="text-xs text-muted-foreground">({fHabits.length})</span>
                </div>
                {f.id !== "general" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => moveHabitFolderUp(f.id)} className="text-muted-foreground w-7 h-7 p-0"><ChevronUp className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => moveHabitFolderDown(f.id)} className="text-muted-foreground w-7 h-7 p-0"><ChevronDown className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditingFolderId(f.id); setFolderName(f.name); setFolderColor(f.color); setFolderEmoji(f.emoji || "📁"); setShowEditFolder(true);
                    }} className="text-accent w-7 h-7 p-0"><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      if (confirm("Удалить папку? Привычки перейдут в Общие.")) {
                        habits.filter((h) => h.folder === f.id).forEach((h) => updateHabit(h.id, { folder: "general" }));
                        deleteHabitFolder(f.id);
                      }
                    }} className="text-destructive w-7 h-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                )}
              </div>
              {!f.collapsed && (
                <div className="divide-y divide-border">
                  {fHabits.length === 0 ? (
                    <div className="px-4 py-3 text-muted-foreground text-sm">Нет привычек</div>
                  ) : fHabits.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 px-4 py-3 border-l-4" style={{ borderLeftColor: h.color }}>
                      <span className="text-xl">{h.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{h.name}</p>
                        <p className="text-xs text-muted-foreground">🔥 {h.streak} · {DAYS_OF_WEEK.filter((d) => h.daysOfWeek.includes(d.id)).map((d) => d.label).join(", ")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => moveHabitUp(h.id)} className="text-muted-foreground w-7 h-7 p-0"><ChevronUp className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => moveHabitDown(h.id)} className="text-muted-foreground w-7 h-7 p-0"><ChevronDown className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(h)} className="text-accent w-7 h-7 p-0"><Edit2 className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Удалить привычку?")) deleteHabit(h.id); }} className="text-destructive w-7 h-7 p-0"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {habits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-medium">Нет привычек</p>
            <p className="text-sm mt-1">Создайте первую привычку!</p>
          </div>
        )}
      </div>

      <FormModal title="Новая привычка" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={handleCreate} submitText="Создать"><HabitForm /></FormModal>
      <FormModal title="Редактировать привычку" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={handleEdit} submitText="Сохранить"><HabitForm /></FormModal>
      <FormModal title="Новая папка" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={(e) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        addHabitFolder({ id: nanoid(), name: folderName, emoji: folderEmoji, color: folderColor, collapsed: false });
        setFolderName(""); setShowCreateFolder(false);
      }} submitText="Создать"><FolderForm /></FormModal>
      <FormModal title="Редактировать папку" isOpen={showEditFolder} onClose={() => { setShowEditFolder(false); setEditingFolderId(null); setFolderName(""); }} onSubmit={(e) => {
        e.preventDefault();
        if (!editingFolderId || !folderName.trim()) return;
        updateHabitFolder(editingFolderId, { name: folderName, color: folderColor, emoji: folderEmoji });
        setShowEditFolder(false); setEditingFolderId(null);
      }} submitText="Сохранить"><FolderForm /></FormModal>
    </>
  );
}

// ─── TasksTab ──────────────────────────────────────────────────────────────
function TasksTab() {
  const { tasks, blocks, addTask, updateTask, deleteTask } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📋");
  const [blockId, setBlockId] = useState("");
  const [days, setDays] = useState<number[]>([]);
  const [isAllDay, setIsAllDay] = useState(true);

  const resetForm = () => {
    setTitle(""); setEmoji("📋"); setBlockId(""); setDays([]); setIsAllDay(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ id: nanoid(), title, emoji, blockId: blockId || undefined, daysOfWeek: days, isAllDay, completedDates: {} });
    resetForm(); setShowCreate(false);
  };

  const handleOpenEdit = (t: Task) => {
    setEditingId(t.id); setTitle(t.title); setEmoji(t.emoji);
    setBlockId(t.blockId || ""); setDays(t.daysOfWeek); setIsAllDay(t.isAllDay);
    setShowEdit(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !title.trim()) return;
    updateTask(editingId, { title, emoji, blockId: blockId || undefined, daysOfWeek: days, isAllDay });
    setShowEdit(false); resetForm();
  };

  const TaskForm = () => (
    <>
      <FormInput label="Название задачи" value={title} onChange={setTitle} placeholder="например, Выпить воду" />
      <EmojiPicker label="Эмодзи" value={emoji} onChange={setEmoji} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Блок (опционально)</label>
        <select value={blockId} onChange={(e) => setBlockId(e.target.value)}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
          <option value="">— Без блока —</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{b.startTime ? ` (${b.startTime}–${b.endTime})` : ""}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Дни недели (пусто = каждый день)</label>
        <DayPicker value={days} onChange={setDays} />
      </div>
      <FormCheckbox label="Задача на весь день (показывать без привязки к блоку)" checked={isAllDay} onChange={setIsAllDay} />
    </>
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1 bg-accent hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Задача
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Нет задач</p>
            <p className="text-sm mt-1">Создайте первую задачу!</p>
          </div>
        ) : tasks.map((t) => {
          const block = blocks.find((b) => b.id === t.blockId);
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border">
              <span className="text-xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground">{block ? `${block.name}` : "На весь день"}</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(t)} className="text-accent w-7 h-7 p-0"><Edit2 className="w-3 h-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Удалить задачу?")) deleteTask(t.id); }} className="text-destructive w-7 h-7 p-0"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <FormModal title="Новая задача" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={handleCreate} submitText="Создать"><TaskForm /></FormModal>
      <FormModal title="Редактировать задачу" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={handleEdit} submitText="Сохранить"><TaskForm /></FormModal>
    </>
  );
}

// ─── BlocksTab ─────────────────────────────────────────────────────────────
function BlocksTab() {
  const { blocks, addBlock, updateBlock, deleteBlock, moveBlockUp, moveBlockDown } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [colorIndex, setColorIndex] = useState(0);

  const resetForm = () => { setName(""); setStartTime("09:00"); setEndTime("10:00"); setColorIndex(0); };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addBlock({ id: nanoid(), name, habits: [], collapsed: false, startTime, endTime, colorIndex });
    resetForm(); setShowCreate(false);
  };

  const handleOpenEdit = (b: typeof blocks[0]) => {
    setEditingId(b.id); setName(b.name); setStartTime(b.startTime || "09:00"); setEndTime(b.endTime || "10:00");
    setColorIndex(b.colorIndex || 0);
    setShowEdit(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !name.trim()) return;
    updateBlock(editingId, { name, startTime, endTime, colorIndex });
    setShowEdit(false); resetForm();
  };

  const BlockForm = () => (
    <>
      <FormInput label="Название блока" value={name} onChange={setName} placeholder="Утренний, Спортивный..." />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Начало</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Конец</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Цвет блока</label>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColorIndex(i)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${colorIndex === i ? "scale-110 border-white" : "border-transparent opacity-60 hover:opacity-100"}`}
              style={{ backgroundColor: ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][i] }}
            />
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1 bg-accent hover:bg-accent/90">
          <Plus className="w-4 h-4" /> Блок
        </Button>
      </div>

      <div className="space-y-2">
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-medium">Нет блоков</p>
            <p className="text-sm mt-1">Блоки — это временные отрезки дня с привычками и задачами</p>
          </div>
        ) : blocks.map((b) => (
          <div key={b.id} className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-border">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: b.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex] + '25' : 'rgba(148, 163, 184, 0.1)' }}>
               <Layers className="w-4 h-4" style={{ color: b.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex] : "#94a3b8" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">{b.name}</p>
              {b.startTime && b.endTime ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {b.startTime} — {b.endTime}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Без времени</p>
              )}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => moveBlockUp(b.id)} className="text-muted-foreground w-7 h-7 p-0"><ChevronUp className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => moveBlockDown(b.id)} className="text-muted-foreground w-7 h-7 p-0"><ChevronDown className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(b)} className="text-accent w-7 h-7 p-0"><Edit2 className="w-3 h-3" /></Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Удалить блок?")) deleteBlock(b.id); }} className="text-destructive w-7 h-7 p-0"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      <FormModal title="Новый блок" isOpen={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} onSubmit={handleCreate} submitText="Создать"><BlockForm /></FormModal>
      <FormModal title="Редактировать блок" isOpen={showEdit} onClose={() => { setShowEdit(false); resetForm(); }} onSubmit={handleEdit} submitText="Сохранить"><BlockForm /></FormModal>
    </>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function HabitsPage() {
  const [tab, setTab] = useState<Tab>("habits");

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "habits", label: "Привычки", icon: <ListChecks className="w-4 h-4" /> },
    { key: "tasks", label: "Задачи", icon: <Plus className="w-4 h-4" /> },
    { key: "blocks", label: "Блоки", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="px-4 pt-5 pb-4">
      <h2 className="text-2xl font-bold text-foreground mb-4">Управление</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all
              ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "habits" && <HabitsTab />}
      {tab === "tasks" && <TasksTab />}
      {tab === "blocks" && <BlocksTab />}
    </div>
  );
}
