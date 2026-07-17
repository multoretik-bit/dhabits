import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, ListTodo, Plus, Target, Trash2, Trophy } from "lucide-react";
import { useApp, type Goal, type Habit, type HabitFolder } from "@/contexts/AppContext";
import HabitRow from "@/components/HabitRow";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";
import { EmptyState, Metric, PageHeader, PageShell, SectionHeading, SegmentedControl } from "@/components/AppUI";

function GoalCard({
  goal,
  habits,
  onProgress,
}: {
  goal: Goal;
  habits: Habit[];
  onProgress: (goal: Goal) => void;
}) {
  const { updateGoal, deleteGoal, moveGoalUp, moveGoalDown } = useApp();
  const [expanded, setExpanded] = useState(false);
  const range = goal.targetValue - goal.startValue;
  const progress = Math.min(100, Math.max(0, range > 0 ? ((goal.currentValue - goal.startValue) / range) * 100 : 0));
  const linked = (goal.linkedHabits ?? []).map((id) => habits.find((habit) => habit.id === id)?.name).filter(Boolean);

  return (
    <article className={`goal-card ${goal.completed ? "is-completed" : ""}`} style={{ "--goal-color": goal.color } as React.CSSProperties}>
      <div className="goal-card-top">
        <span className="goal-emoji">{goal.emoji || "🎯"}</span>
        <div className="goal-copy" onClick={() => setExpanded((value) => !value)}>
          <div className="flex items-center gap-2">
            <h3 className={expanded ? "" : "truncate"}>{goal.name}</h3>
            {goal.completed && <span className="goal-done">Готово</span>}
          </div>
          <p className={expanded ? "" : "truncate"}>{goal.description || "Без описания"}</p>
        </div>
        <div className="goal-reward"><img src="/coin.png" alt="" /><strong>{goal.coins}</strong></div>
      </div>
      <div className="goal-progress-copy"><span>{goal.currentValue} / {goal.targetValue}</span><strong>{Math.round(progress)}%</strong></div>
      <div className="goal-progress"><i style={{ width: `${progress}%` }} /></div>
      {linked.length > 0 && <p className="goal-linked">Связано: {linked.join(", ")}</p>}
      <div className="goal-actions">
        <button onClick={() => onProgress(goal)} className="app-button"><Target className="size-4" /> Добавить прогресс</button>
        <button onClick={() => moveGoalUp(goal.id)} className="icon-button is-small" aria-label="Переместить выше"><ArrowUp className="size-4" /></button>
        <button onClick={() => moveGoalDown(goal.id)} className="icon-button is-small" aria-label="Переместить ниже"><ArrowDown className="size-4" /></button>
        <button onClick={() => { if (window.confirm("Удалить цель навсегда?")) deleteGoal(goal.id); }} className="icon-button is-small subtle-danger" aria-label="Удалить цель"><Trash2 className="size-4" /></button>
      </div>
    </article>
  );
}

export default function GoalsPage() {
  const {
    goals, goalFolders, habits, habitFolders,
    updateGoal, deleteGoalFolder, toggleGoalFolderCollapse, toggleHabitFolderCollapse,
    moveGoalFolderUp, moveGoalFolderDown,
  } = useApp();
  const [activeTab, setActiveTab] = useState<"goals" | "habits">("goals");
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const habitsForToday = useMemo(() => habits.filter((habit) => habit.daysOfWeek.includes(dayOfWeek)), [habits, dayOfWeek]);
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const averageProgress = goals.length ? Math.round(goals.reduce((sum, goal) => {
    const range = goal.targetValue - goal.startValue;
    return sum + Math.min(100, Math.max(0, range > 0 ? ((goal.currentValue - goal.startValue) / range) * 100 : 0));
  }, 0) / goals.length) : 0;

  const openProgress = (goal: Goal) => {
    setProgressGoalId(goal.id);
    setProgressValue("");
  };

  const saveProgress = (event: React.FormEvent) => {
    event.preventDefault();
    const goal = goals.find((item) => item.id === progressGoalId);
    if (!goal) return;
    const nextValue = goal.currentValue + (Number.parseFloat(progressValue) || 0);
    updateGoal(goal.id, { currentValue: nextValue, completed: nextValue >= goal.targetValue });
    setProgressGoalId(null);
    setProgressValue("");
  };

  const renderGoalFolder = (folder: { id: string; name: string; emoji: string; color: string; collapsed: boolean }, isGeneral = false) => {
    const folderGoals = goals.filter((goal) => goal.folder === folder.id);
    return (
      <section key={folder.id} className="growth-folder app-surface">
        <button className="growth-folder-head" onClick={() => !isGeneral && toggleGoalFolderCollapse(folder.id)}>
          <span className="folder-color" style={{ backgroundColor: folder.color }} />
          <span className="folder-title">{folder.emoji} {folder.name}</span>
          <span className="section-meta">{folderGoals.length}</span>
          <span className="folder-spacer" />
          {!isGeneral && (
            <span className="folder-actions" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => moveGoalFolderUp(folder.id)} aria-label="Переместить папку выше"><ArrowUp className="size-4" /></button>
              <button onClick={() => moveGoalFolderDown(folder.id)} aria-label="Переместить папку ниже"><ArrowDown className="size-4" /></button>
              <button onClick={() => { if (window.confirm("Удалить папку? Цели будут перенесены в «Общие».")) { folderGoals.forEach((goal) => updateGoal(goal.id, { folder: "general" })); deleteGoalFolder(folder.id); } }} aria-label="Удалить папку"><Trash2 className="size-4" /></button>
            </span>
          )}
          {!isGeneral && (folder.collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />)}
        </button>
        {(isGeneral || !folder.collapsed) && (
          <div className="growth-folder-body">
            {folderGoals.length ? folderGoals.map((goal) => <GoalCard key={goal.id} goal={goal} habits={habits} onProgress={openProgress} />) : <EmptyState compact title="В этой папке пока нет целей" />}
          </div>
        )}
      </section>
    );
  };

  const renderHabitFolder = (folder: HabitFolder) => {
    const folderHabits = habitsForToday.filter((habit) => habit.folder === folder.id);
    return (
      <section key={folder.id} className="growth-folder app-surface">
        <button className="growth-folder-head" onClick={() => toggleHabitFolderCollapse(folder.id)}>
          <span className="folder-color" style={{ backgroundColor: folder.color }} />
          <span className="folder-title">{folder.emoji || "📁"} {folder.name}</span>
          <span className="section-meta">{folderHabits.length}</span>
          <span className="folder-spacer" />
          {folder.collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
        {!folder.collapsed && <div className="growth-folder-body">{folderHabits.length ? folderHabits.map((habit) => <HabitRow key={habit.id} habit={habit} dateStr={dateStr} />) : <EmptyState compact title="Сегодня в этой папке ничего нет" />}</div>}
      </section>
    );
  };

  const progressGoal = goals.find((goal) => goal.id === progressGoalId);

  return (
    <PageShell className="growth-page">
      <PageHeader
        eyebrow="Личный рост"
        title="Саморазвитие"
        description="Следите за движением к целям и поддерживайте привычки без лишнего визуального шума."
        actions={<Link href="/add" className="app-button"><Plus className="size-4" /> Создать</Link>}
      />

      <div className="growth-overview">
        <Metric icon={Trophy} label="Целей завершено" value={`${completedGoals}/${goals.length}`} hint="за всё время" accent="var(--coin)" />
        <Metric icon={Target} label="Средний прогресс" value={`${averageProgress}%`} hint="по активным целям" />
        <Metric icon={ListTodo} label="Привычек сегодня" value={habitsForToday.length} hint="по расписанию" accent="var(--success)" />
      </div>

      <SegmentedControl value={activeTab} onChange={setActiveTab} ariaLabel="Раздел саморазвития" items={[
        { value: "goals", label: "Цели", icon: Target, count: goals.length },
        { value: "habits", label: "Привычки", icon: ListTodo, count: habitsForToday.length },
      ]} />

      <div className="growth-list">
        {activeTab === "goals" ? (
          goals.length || goalFolders.length ? <>
            {renderGoalFolder({ id: "general", name: "Общие цели", emoji: "🏆", color: "var(--coin)", collapsed: false }, true)}
            {goalFolders.filter((folder) => folder.id !== "general").map((folder) => renderGoalFolder(folder))}
          </> : <EmptyState icon={Target} title="Добавьте первую цель" description="Цель появится здесь, а ежедневные действия можно связать с привычками." action={<Link href="/add" className="app-button">Перейти к созданию</Link>} />
        ) : habitFolders.map(renderHabitFolder)}
      </div>

      <FormModal title="Обновить прогресс" isOpen={Boolean(progressGoal)} onClose={() => { setProgressGoalId(null); setProgressValue(""); }} onSubmit={saveProgress} submitText="Записать успех">
        {progressGoal && <div className="progress-modal-summary"><span>{progressGoal.emoji}</span><div><strong>{progressGoal.name}</strong><small>Сейчас {progressGoal.currentValue} · осталось {Math.max(0, progressGoal.targetValue - progressGoal.currentValue)}</small></div></div>}
        <FormInput label="Сколько добавить" value={progressValue} onChange={setProgressValue} type="number" placeholder="5" />
      </FormModal>
    </PageShell>
  );
}
