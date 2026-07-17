import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  LayoutGrid,
  ListTodo,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useApp, type HabitBlock, type Task, getCurrentBlock } from "@/contexts/AppContext";
import { formatDateToDateString, isSameDay } from "@/lib/dateUtils";
import Calendar from "@/components/Calendar";
import HabitRow from "@/components/HabitRow";
import TaskRow from "@/components/TaskRow";
import CoinDisplay from "@/components/CoinDisplay";
import FormModal from "@/components/FormModal";
import EmojiPicker from "@/components/EmojiPicker";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import { FormCheckbox, FormInput } from "@/components/FormInputs";
import { EmptyState, Metric, PageHeader, PageShell, SectionHeading, SegmentedControl } from "@/components/AppUI";

const DAYS_OF_WEEK = [
  { id: 1, label: "Пн" }, { id: 2, label: "Вт" }, { id: 3, label: "Ср" },
  { id: 4, label: "Чт" }, { id: 5, label: "Пт" }, { id: 6, label: "Сб" }, { id: 0, label: "Вс" },
];

function DayPicker({ value, onChange }: { value: number[]; onChange: (value: number[]) => void }) {
  return (
    <div className="day-picker">
      {DAYS_OF_WEEK.map((day) => (
        <button key={day.id} type="button" onClick={() => onChange(value.includes(day.id) ? value.filter((item) => item !== day.id) : [...value, day.id])} className={value.includes(day.id) ? "is-active" : ""}>
          {day.label}
        </button>
      ))}
    </div>
  );
}

function timeToMinutes(time?: string) {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getBlockColor(block?: HabitBlock | null) {
  if (!block) return "#315cff";
  if (block.color) return block.color;
  if (block.colorIndex !== undefined) return ["#00a7c7", "#315cff", "#8b5cf6", "#16a36f", "#dda400", "#d94a4a", "#d44fb3", "#ef7137"][block.colorIndex] ?? "#315cff";
  return "#315cff";
}

export default function Home() {
  const { habits, tasks, blocks, coins, addTask } = useApp();
  const [mode, setMode] = useState<"focus" | "schedule">("focus");
  const [dayTab, setDayTab] = useState<"habits" | "tasks" | "plans">("habits");
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskEmoji, setTaskEmoji] = useState("📋");
  const [taskColor, setTaskColor] = useState("#315cff");
  const [taskBlockId, setTaskBlockId] = useState("");
  const [taskDays, setTaskDays] = useState<number[]>([]);
  const [taskIsAllDay, setTaskIsAllDay] = useState(true);
  const [taskCoins, setTaskCoins] = useState("5");
  const [taskIsOneTime, setTaskIsOneTime] = useState(false);
  const [taskSpecificDate, setTaskSpecificDate] = useState("");
  const [taskTime, setTaskTime] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dateStr = formatDateToDateString(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  const selectedIsToday = isSameDay(selectedDate, now);

  const todayBlocks = useMemo(() => blocks
    .filter((block) => block.isOneTime ? block.specificDate === dateStr : !block.daysOfWeek?.length || block.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)), [blocks, dateStr, dayOfWeek]);

  const todayTasks = useMemo(() => tasks
    .filter((task) => task.specificDate ? task.specificDate === dateStr : !task.daysOfWeek?.length || task.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)), [tasks, dateStr, dayOfWeek]);

  const activeBlock = selectedIsToday ? getCurrentBlock(todayBlocks, now) : null;
  const featuredBlock = activeBlock ?? todayBlocks[0] ?? null;
  const featuredColor = getBlockColor(featuredBlock);
  const featuredHabits = featuredBlock ? habits.filter((habit) => habit.blockId === featuredBlock.id && habit.daysOfWeek.includes(dayOfWeek)) : [];
  const featuredTasks = featuredBlock ? todayTasks.filter((task) => task.blockId === featuredBlock.id) : [];
  const allDayHabits = habits.filter((habit) => (!habit.blockId || habit.blockId === "general") && habit.daysOfWeek.includes(dayOfWeek));
  const allDayTasks = todayTasks.filter((task) => !task.blockId);
  const plans = todayBlocks.flatMap((block) => [
    ...(block.systemUrl ? [{ id: `${block.id}-legacy`, name: "План", url: block.systemUrl, block }] : []),
    ...(block.plans ?? []).map((plan) => ({ ...plan, block })),
  ]);

  const focusItems = [...featuredHabits, ...featuredTasks];
  const completedCount = focusItems.filter((item) => Boolean(item.completedDates?.[dateStr])).length;
  const completion = focusItems.length ? Math.round((completedCount / focusItems.length) * 100) : 0;

  let timelineProgress = 0;
  if (activeBlock?.startTime && activeBlock.endTime) {
    const start = timeToMinutes(activeBlock.startTime);
    const end = timeToMinutes(activeBlock.endTime);
    const current = now.getHours() * 60 + now.getMinutes();
    if (end > start) timelineProgress = Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100));
  }

  const resetTask = () => {
    setTaskTitle(""); setTaskEmoji("📋"); setTaskColor("#315cff"); setTaskBlockId("");
    setTaskDays([]); setTaskIsAllDay(true); setTaskCoins("5"); setTaskIsOneTime(false); setTaskSpecificDate(""); setTaskTime("");
  };

  const openTaskModal = () => {
    setTaskSpecificDate(dateStr);
    setTaskIsOneTime(true);
    setShowTaskModal(true);
  };

  const handleTaskSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    addTask({
      id: nanoid(), title: taskTitle.trim(), emoji: taskEmoji, color: taskColor,
      blockId: taskBlockId || undefined, daysOfWeek: taskDays,
      specificDate: taskSpecificDate || undefined, time: taskTime || undefined,
      isAllDay: taskIsAllDay, completedDates: {}, coins: Number(taskCoins), isOneTime: taskIsOneTime,
    });
    setShowTaskModal(false);
    resetTask();
  };

  return (
    <PageShell className="home-page">
      <PageHeader
        eyebrow={selectedDate.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
        title={selectedIsToday ? "Сегодня" : "План дня"}
        description="Всё важное на одном экране: текущий блок, задачи, привычки и прогресс."
        actions={
          <SegmentedControl value={mode} onChange={setMode} ariaLabel="Режим главной страницы" items={[
            { value: "focus", label: "Фокус", icon: Target },
            { value: "schedule", label: "Расписание", icon: CalendarDays },
          ]} />
        }
      />

      <Calendar selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <AnimatePresence mode="wait">
        {mode === "focus" ? (
          <motion.div key="focus" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="focus-layout">
            <section className="focus-card" style={{ "--block-color": featuredColor } as React.CSSProperties}>
              {featuredBlock ? (
                <>
                  <span className="focus-glow focus-glow-one" />
                  <span className="focus-glow focus-glow-two" />
                  <img className="focus-companion" src="/illustrations/focus-companion.png" alt="" aria-hidden="true" />
                  <div className="focus-card-head">
                    <div>
                      <p className="focus-label">{activeBlock ? "Сейчас в фокусе" : "Первый блок дня"}</p>
                      <h2>{featuredBlock.name}</h2>
                      <p className="focus-time"><Clock className="size-4" /> {featuredBlock.startTime || "—"}–{featuredBlock.endTime || "—"}</p>
                    </div>
                    <div className="focus-links">
                      {featuredBlock.systemUrl && <a href={featuredBlock.systemUrl} target="_blank" rel="noreferrer" className="icon-button" aria-label="Открыть план"><ExternalLink className="size-5" /></a>}
                      {featuredBlock.plans?.map((plan) => <a key={plan.id} href={plan.url} target="_blank" rel="noreferrer" className="icon-button" aria-label={`Открыть ${plan.name}`}><ExternalLink className="size-5" /></a>)}
                    </div>
                  </div>
                  <div className="timeline-progress">
                    <div><span>Время блока</span><strong>{activeBlock ? Math.round(timelineProgress) : 0}%</strong></div>
                    <span><i style={{ width: `${activeBlock ? timelineProgress : 0}%` }} /></span>
                  </div>
                  <div className="focus-columns">
                    <div>
                      <SectionHeading icon={LayoutGrid} title="Привычки" meta={featuredHabits.length} />
                      {featuredHabits.length ? featuredHabits.map((habit) => <HabitRow key={habit.id} habit={habit} dateStr={dateStr} hideUnitTracker />) : <EmptyState compact title="Нет привычек в этом блоке" />}
                    </div>
                    <div>
                      <SectionHeading icon={ListTodo} title="Задачи" meta={featuredTasks.length} />
                      {featuredTasks.length ? featuredTasks.map((task) => <TaskRow key={task.id} task={task} dateStr={dateStr} />) : (
                        <div className="illustrated-empty">
                          <img src="/illustrations/tasks-companion.png" alt="" aria-hidden="true" />
                          <div><strong>Нет задач</strong><span>Добавьте один понятный следующий шаг.</span></div>
                          <button onClick={openTaskModal} className="text-action">Добавить задачу <Plus className="size-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState icon={Sparkles} title="Свободное время" description="На выбранное время блоков нет. Можно восстановиться или запланировать следующий шаг." action={<Link href="/add" className="app-button">Создать блок</Link>} />
              )}
            </section>

            <aside className="focus-summary">
              <section className="app-surface progress-card progress-showcase">
                <i className="progress-spark progress-spark-one" />
                <i className="progress-spark progress-spark-two" />
                <div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` } as React.CSSProperties}><strong>{completion}%</strong></div>
                <div><p>Прогресс блока</p><span>{completedCount} из {focusItems.length} выполнено</span></div>
              </section>
              <div className="metric-grid">
                <Metric icon={CheckCircle2} label="Выполнено" value={completedCount} hint="в текущем блоке" accent="var(--success)" />
                <Metric icon={Clock} label="Блоков сегодня" value={todayBlocks.length} hint="в расписании" accent="var(--violet)" />
              </div>
              <section className="app-surface reward-card">
                <div className="reward-card-copy">
                  <span>Ваш баланс</span>
                  <CoinDisplay amount={coins} size="lg" />
                  <small>Каждый выполненный шаг приближает награду</small>
                </div>
                <img src="/illustrations/reward-companion.png" alt="Подарок и монеты" />
                <Link href="/shop" className="reward-card-link">Мои награды <ExternalLink className="size-4" /></Link>
              </section>
              <section className="app-surface quick-card">
                <SectionHeading icon={Sparkles} title="Быстрые действия" />
                <button className="app-button" onClick={openTaskModal}><Plus className="size-4" /> Добавить задачу</button>
                <Link href="/add" className="app-button is-secondary"><LayoutGrid className="size-4" /> Открыть управление</Link>
              </section>
            </aside>

            <section className="day-content app-surface">
              <SegmentedControl value={dayTab} onChange={setDayTab} ariaLabel="Содержимое выбранного дня" items={[
                { value: "habits", label: "Привычки", icon: Target, count: allDayHabits.length },
                { value: "tasks", label: "Задачи", icon: ListTodo, count: allDayTasks.length },
                { value: "plans", label: "Планы", icon: ExternalLink, count: plans.length },
              ]} />
              <div className="day-content-body">
                {dayTab === "habits" && (allDayHabits.length ? allDayHabits.map((habit) => <HabitRow key={habit.id} habit={habit} dateStr={dateStr} hideUnitTracker />) : <EmptyState title="Нет привычек на весь день" compact />)}
                {dayTab === "tasks" && (allDayTasks.length ? allDayTasks.map((task) => <TaskRow key={task.id} task={task} dateStr={dateStr} />) : <EmptyState title="Нет задач на весь день" compact action={<button className="text-action" onClick={openTaskModal}>Добавить <Plus className="size-4" /></button>} />)}
                {dayTab === "plans" && (plans.length ? <div className="plan-grid">{plans.map((plan) => <a key={plan.id} href={plan.url} target="_blank" rel="noreferrer" className="plan-card" style={{ borderLeftColor: getBlockColor(plan.block) }}><span>{plan.name || "План"}</span><small>{plan.block.name}</small><ExternalLink className="size-4" /></a>)}</div> : <EmptyState title="Нет прикреплённых планов" compact />)}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="schedule-layout">
            <section className="app-surface schedule-timeline">
              <SectionHeading icon={Clock} title="Блоки дня" meta={todayBlocks.length} />
              {todayBlocks.length ? todayBlocks.map((block) => {
                const blockTasks = todayTasks.filter((task) => task.blockId === block.id);
                const blockHabits = habits.filter((habit) => habit.blockId === block.id && habit.daysOfWeek.includes(dayOfWeek));
                return <article key={block.id} className="schedule-block" style={{ "--block-color": getBlockColor(block) } as React.CSSProperties}><span className="schedule-dot" /><div className="schedule-time">{block.startTime}<small>{block.endTime}</small></div><div className="schedule-copy"><strong>{block.name}</strong><span>{blockHabits.length} привычек · {blockTasks.length} задач</span></div></article>;
              }) : <EmptyState title="Расписание пока пустое" description="Создайте блок во вкладке «Добавить»." />}
            </section>
            <section className="app-surface schedule-tasks">
              <SectionHeading icon={ListTodo} title="Задачи дня" meta={todayTasks.length} action={<button onClick={openTaskModal} className="icon-button is-small"><Plus className="size-4" /></button>} />
              {todayTasks.length ? todayTasks.map((task) => <TaskRow key={task.id} task={task} dateStr={dateStr} isCondensed />) : <EmptyState compact title="Задач пока нет" />}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <FormModal title="Новая задача" isOpen={showTaskModal} onClose={() => { setShowTaskModal(false); resetTask(); }} onSubmit={handleTaskSubmit} submitText="Создать">
        <FormInput label="Название задачи" value={taskTitle} onChange={setTaskTitle} placeholder="Например, выпить воду" />
        <EmojiPicker label="Эмодзи" value={taskEmoji} onChange={setTaskEmoji} />
        <div className="space-y-2"><label className="text-sm font-medium">Цвет</label><AdvancedColorPicker value={taskColor} onChange={setTaskColor} /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Блок</label><select value={taskBlockId} onChange={(event) => setTaskBlockId(event.target.value)} className="form-select"><option value="">Без блока</option>{blocks.map((block) => <option key={block.id} value={block.id}>{block.name}</option>)}</select></div>
        <div className="space-y-2"><label className="text-sm font-medium">Дни недели</label><DayPicker value={taskDays} onChange={setTaskDays} /></div>
        <FormInput label="Конкретная дата" value={taskSpecificDate} onChange={setTaskSpecificDate} type="date" />
        <FormInput label="Время" value={taskTime} onChange={setTaskTime} type="time" />
        <FormCheckbox label="На весь день" checked={taskIsAllDay} onChange={setTaskIsAllDay} />
        <FormInput label="Монет за выполнение" value={taskCoins} onChange={setTaskCoins} type="number" />
        <FormCheckbox label="Одноразовая задача" checked={taskIsOneTime} onChange={setTaskIsOneTime} />
      </FormModal>
    </PageShell>
  );
}
