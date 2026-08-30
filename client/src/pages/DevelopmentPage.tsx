import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookMarked,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Coins,
  ExternalLink,
  Gauge,
  Globe2,
  Headphones,
  Layers3,
  MapPinned,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { nanoid } from "nanoid";
import { PageHeader, PageShell } from "@/components/AppUI";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import EmojiPicker from "@/components/EmojiPicker";
import { useApp } from "@/contexts/AppContext";
import { colorBelongsToLifeAspect, getTimerMinutesForAspectInYear, getTimerMinutesForAspectOnDate, getTimerMinutesForAspectPartsOnDate, LIFE_ASPECT_GROUPS, LIFE_ASPECTS, type LifeAspectDailyPart } from "@/lib/lifeAspects";
import { getGoalProgressForDate, getGoalProgressUnit } from "@/lib/goalProgress";

function getDefaultDeadline() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function formatDeadline(value?: string) {
  if (!value) return "Без срока";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function getDeadlineState(value?: string) {
  if (!value) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${value}T00:00:00`);
  const days = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`;
  if (days === 0) return "Срок сегодня";
  return `Осталось ${days} дн.`;
}

export default function DevelopmentPage() {
  const {
    identitySystems,
    identitySystemIdeas,
    updateIdentitySystem,
    addIdentitySystemIdea,
    updateIdentitySystemIdea,
    deleteIdentitySystemIdea,
    activitySessions,
    blocks,
    habits,
    tasks,
    goals,
    goalFolders,
    addGoal,
    updateGoal,
    deleteGoal,
  } = useApp();
  const [selectedAspectId, setSelectedAspectId] = useState<string | null>(null);
  const [showVisionForm, setShowVisionForm] = useState(false);
  const [visionText, setVisionText] = useState("");
  const [visionDeadline, setVisionDeadline] = useState(getDefaultDeadline);
  const [editingVisionId, setEditingVisionId] = useState<string | null>(null);
  const [editingDailyTarget, setEditingDailyTarget] = useState(false);
  const [dailyTargetDraft, setDailyTargetDraft] = useState("");
  const [dailyPartsDraft, setDailyPartsDraft] = useState<LifeAspectDailyPart[]>([]);
  const [activeSatisfactionPart, setActiveSatisfactionPart] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTarget, setGoalTarget] = useState("100");
  const [goalUnit, setGoalUnit] = useState("");
  const [goalDeadline, setGoalDeadline] = useState(getDefaultDeadline);
  const [goalVisionId, setGoalVisionId] = useState("");
  const [goalEmoji, setGoalEmoji] = useState("🎯");
  const [goalColor, setGoalColor] = useState("");
  const [goalFolder, setGoalFolder] = useState("general");
  const [goalCoins, setGoalCoins] = useState("100");
  const [goalProgressType, setGoalProgressType] = useState<"manual" | "activity_minutes">("manual");
  const [goalActivityName, setGoalActivityName] = useState("");

  const systems = useMemo(() => LIFE_ASPECTS.map((fallback) => {
    const saved = identitySystems.find((system) => system.id === fallback.id);
    return { ...fallback, ...saved, name: saved?.aspect || fallback.name, color: fallback.color };
  }), [identitySystems]);
  const selectedAspect = systems.find((aspect) => aspect.id === selectedAspectId);
  const visions = identitySystemIdeas.filter((idea) => idea.aspectId === selectedAspectId);
  const aspectGoals = goals.filter((goal) => goal.aspectId === selectedAspectId);
  const knownActivityNames = Array.from(new Map(activitySessions.map((session) => [
    session.title.trim().toLocaleLowerCase("ru-RU"),
    session.title.trim(),
  ])).values()).filter(Boolean).sort((a, b) => a.localeCompare(b, "ru-RU"));
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekday = today.getDay();
  const currentYear = today.getFullYear();

  const yearlyAspectMinutes = useMemo(() => {
    if (!selectedAspect) return 0;
    return getTimerMinutesForAspectInYear(activitySessions, selectedAspect.id, currentYear);
  }, [activitySessions, currentYear, selectedAspect]);

  const dailyAspectProgress = useMemo(() => systems.map((aspect) => {
    const configuredParts = (aspect.dailyParts || []).filter((part) => part.name.trim() && part.targetMinutes > 0);
    const parts = getTimerMinutesForAspectPartsOnDate(activitySessions, aspect.id, todayString, configuredParts);
    return {
      ...aspect,
      parts,
      target: parts.length
        ? parts.reduce((sum, part) => sum + part.targetMinutes, 0)
        : Math.max(0, Math.round(aspect.dailyTargetMinutes || 0)),
      actual: parts.length
        ? parts.reduce((sum, part) => sum + part.actualMinutes, 0)
        : getTimerMinutesForAspectOnDate(activitySessions, aspect.id, todayString),
    };
  }), [activitySessions, systems, todayString]);
  const targetedDailyAspects = dailyAspectProgress.filter((aspect) => aspect.target > 0);
  const totalDailyTarget = targetedDailyAspects.reduce((sum, aspect) => sum + aspect.target, 0);
  const totalDailyActual = targetedDailyAspects.reduce((sum, aspect) => sum + aspect.actual, 0);
  const creditedDailyMinutes = targetedDailyAspects.reduce((sum, aspect) => sum + (aspect.parts.length
    ? aspect.parts.reduce((partSum, part) => partSum + Math.min(part.actualMinutes, part.targetMinutes), 0)
    : Math.min(aspect.actual, aspect.target)), 0);
  const satisfactionPercent = totalDailyTarget ? Math.round((creditedDailyMinutes / totalDailyTarget) * 100) : 0;
  const totalDailyPercent = totalDailyTarget ? Math.round((totalDailyActual / totalDailyTarget) * 100) : 0;
  const dailyOverflow = targetedDailyAspects.reduce((sum, aspect) => sum + (aspect.parts.length
    ? aspect.parts.reduce((partSum, part) => partSum + Math.max(0, part.actualMinutes - part.targetMinutes), 0)
    : Math.max(0, aspect.actual - aspect.target)), 0);
  const selectedSatisfactionPart = targetedDailyAspects.flatMap((aspect) => aspect.parts.map((part) => ({
    ...part,
    aspectId: aspect.id,
    aspectName: aspect.name,
    aspectColor: aspect.color,
    key: `${aspect.id}-${part.id}`,
  }))).find((part) => part.key === activeSatisfactionPart);

  const aspectBlocks = useMemo(() => {
    if (!selectedAspect) return [];
    return blocks.filter((block) => {
      const belongsToAspect = colorBelongsToLifeAspect(block.color, selectedAspect.id);
      const isScheduledToday = block.isOneTime
        ? block.specificDate === todayString
        : !block.daysOfWeek?.length || block.daysOfWeek.includes(weekday);
      return belongsToAspect && isScheduledToday;
    });
  }, [blocks, selectedAspect, todayString, weekday]);

  const closeVisionForm = () => {
    setShowVisionForm(false);
    setEditingVisionId(null);
    setVisionText("");
    setVisionDeadline(getDefaultDeadline());
  };

  const startAddingVision = () => {
    setEditingVisionId(null);
    setVisionText("");
    setVisionDeadline(getDefaultDeadline());
    setShowVisionForm(true);
  };

  const startEditingVision = (vision: (typeof identitySystemIdeas)[number]) => {
    setEditingVisionId(vision.id);
    setVisionText(vision.text);
    setVisionDeadline(vision.deadline || getDefaultDeadline());
    setShowVisionForm(true);
  };

  const saveVision = () => {
    if (!selectedAspect || !visionText.trim() || !visionDeadline) return;
    if (editingVisionId) {
      updateIdentitySystemIdea(editingVisionId, { text: visionText.trim(), deadline: visionDeadline });
    } else {
      addIdentitySystemIdea(selectedAspect.id, visionText.trim(), undefined, visionDeadline);
    }
    closeVisionForm();
  };

  const closeGoalForm = () => {
    setShowGoalForm(false);
    setEditingGoalId(null);
    setGoalName("");
    setGoalDescription("");
    setGoalTarget("100");
    setGoalUnit("");
    setGoalDeadline(getDefaultDeadline());
    setGoalVisionId("");
    setGoalEmoji("🎯");
    setGoalColor(selectedAspect?.color || "");
    setGoalFolder("general");
    setGoalCoins("100");
    setGoalProgressType("manual");
    setGoalActivityName("");
  };

  const startAddingGoal = (visionId = "") => {
    closeGoalForm();
    setGoalVisionId(visionId);
    setShowGoalForm(true);
  };

  const startEditingGoal = (goal: (typeof goals)[number]) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalDescription(goal.description || "");
    setGoalTarget(String(goal.targetValue));
    setGoalUnit(goal.unit || "");
    setGoalDeadline(goal.deadline || getDefaultDeadline());
    setGoalVisionId(visions.some((vision) => vision.id === goal.visionId) ? goal.visionId || "" : "");
    setGoalEmoji(goal.emoji || "🎯");
    setGoalColor(goal.color || selectedAspect?.color || "");
    setGoalFolder(goal.folder || "general");
    setGoalCoins(String(goal.coins || 0));
    setGoalProgressType(goal.progressType || "manual");
    setGoalActivityName(goal.activityName || "");
    setShowGoalForm(true);
  };

  const saveAspectGoal = () => {
    const trimmedActivity = goalActivityName.trim();
    if (!selectedAspect || !goalName.trim() || (goalProgressType === "activity_minutes" && !trimmedActivity)) return;
    const targetValue = Math.max(1, Number(goalTarget) || 1);
    if (editingGoalId) {
      const currentGoal = goals.find((goal) => goal.id === editingGoalId);
      if (!currentGoal) return;
      const trackingChanged = currentGoal.progressType !== goalProgressType
        || (currentGoal.activityName || "").trim().toLocaleLowerCase("ru-RU") !== trimmedActivity.toLocaleLowerCase("ru-RU");
      const nextCurrentValue = trackingChanged ? 0 : currentGoal.currentValue;
      updateGoal(editingGoalId, {
        name: goalName.trim(),
        emoji: goalEmoji,
        description: goalDescription.trim(),
        targetValue,
        unit: goalProgressType === "manual" ? goalUnit.trim() || undefined : undefined,
        deadline: goalDeadline || undefined,
        aspectId: selectedAspect.id,
        visionId: goalVisionId || undefined,
        color: goalColor || selectedAspect.color,
        folder: goalFolder,
        coins: Math.max(0, Number(goalCoins) || 0),
        progressType: goalProgressType,
        activityName: goalProgressType === "activity_minutes" ? trimmedActivity : undefined,
        activityTrackingStartedAt: goalProgressType === "activity_minutes" ? (trackingChanged ? new Date().toISOString() : currentGoal.activityTrackingStartedAt || new Date().toISOString()) : undefined,
        currentValue: nextCurrentValue,
        completed: nextCurrentValue >= targetValue,
      });
    } else {
      addGoal({
        id: nanoid(),
        name: goalName.trim(),
        emoji: goalEmoji,
        description: goalDescription.trim(),
        linkedHabits: [],
        coins: Math.max(0, Number(goalCoins) || 0),
        streak: 0,
        folder: goalFolder,
        completed: false,
        startValue: 0,
        targetValue,
        currentValue: 0,
        color: goalColor || selectedAspect.color,
        deadline: goalDeadline || undefined,
        progressType: goalProgressType,
        activityName: goalProgressType === "activity_minutes" ? trimmedActivity : undefined,
        activityTrackingStartedAt: goalProgressType === "activity_minutes" ? new Date().toISOString() : undefined,
        aspectId: selectedAspect.id,
        visionId: goalVisionId || undefined,
        unit: goalProgressType === "manual" ? goalUnit.trim() || undefined : undefined,
      });
    }
    closeGoalForm();
  };

  const startEditingDailyTarget = () => {
    setDailyTargetDraft(String(selectedAspect?.dailyTargetMinutes || ""));
    setDailyPartsDraft((selectedAspect?.dailyParts || []).map((part) => ({ ...part })));
    setEditingDailyTarget(true);
  };

  const addDailyPart = () => {
    setDailyPartsDraft((parts) => [...parts, { id: nanoid(), name: "", targetMinutes: 30 }]);
  };

  const updateDailyPart = (id: string, updates: Partial<LifeAspectDailyPart>) => {
    setDailyPartsDraft((parts) => parts.map((part) => part.id === id ? { ...part, ...updates } : part));
  };

  const saveDailyTarget = () => {
    if (!selectedAspect) return;
    const parts = dailyPartsDraft
      .map((part) => ({
        ...part,
        name: part.name.trim(),
        targetMinutes: Math.min(1440, Math.max(0, Math.round(Number(part.targetMinutes) || 0))),
        rewardPerMinute: part.rewardPerMinute === undefined
          ? undefined
          : Math.max(0, Math.round((Number(part.rewardPerMinute) || 0) * 1000) / 1000),
      }))
      .filter((part) => part.name && part.targetMinutes > 0);
    const nextTarget = parts.length
      ? parts.reduce((sum, part) => sum + part.targetMinutes, 0)
      : Math.min(1440, Math.max(0, Math.round(Number(dailyTargetDraft) || 0)));
    updateIdentitySystem(selectedAspect.id, { dailyTargetMinutes: nextTarget, dailyParts: parts });
    setDailyTargetDraft("");
    setDailyPartsDraft([]);
    setEditingDailyTarget(false);
  };

  const cancelEditingDailyTarget = () => {
    setEditingDailyTarget(false);
    setDailyTargetDraft("");
    setDailyPartsDraft([]);
  };

  const openAspect = (id: string) => {
    cancelEditingDailyTarget();
    setSelectedAspectId(id);
  };

  const closeAspect = () => {
    cancelEditingDailyTarget();
    closeVisionForm();
    closeGoalForm();
    setSelectedAspectId(null);
  };

  if (!selectedAspect) {
    return (
      <PageShell className="development-page">
        <PageHeader
          eyebrow="Долгосрочная система"
          title="Развитие"
          description="Десять аспектов жизни связывают ваше видение с тем, что вы реально делаете каждый день. Выберите сферу, чтобы увидеть её направление и дневные блоки."
        />

        <section className="satisfaction-card">
          <div className="satisfaction-head">
            <div className="satisfaction-title"><span><Gauge className="size-5" /></span><div><h2>Шкала удовлетворения</h2><p>Движение по главным аспектам за сегодня</p></div></div>
            <div className="satisfaction-score"><strong>{satisfactionPercent}%</strong><span>{totalDailyActual.toLocaleString("ru-RU")} / {totalDailyTarget.toLocaleString("ru-RU")} мин</span></div>
          </div>

          {targetedDailyAspects.length ? (
            <>
              {targetedDailyAspects.some((aspect) => aspect.parts.length > 0) && (
                <div className={selectedSatisfactionPart ? "satisfaction-hover-info is-active" : "satisfaction-hover-info"} style={{ "--aspect-color": selectedSatisfactionPart?.aspectColor || "var(--primary)" } as React.CSSProperties}>
                  {selectedSatisfactionPart ? (
                    <><span /><div><strong>{selectedSatisfactionPart.aspectName} · {selectedSatisfactionPart.name}</strong><small>{selectedSatisfactionPart.actualMinutes} из {selectedSatisfactionPart.targetMinutes} мин · начислено за таймеры с названием «{selectedSatisfactionPart.name}»</small></div></>
                  ) : <small>Наведите на часть шкалы, чтобы увидеть её источник</small>}
                </div>
              )}
              <div className="satisfaction-track" aria-label={`Шкала удовлетворения заполнена на ${satisfactionPercent}%`}>
                {targetedDailyAspects.map((aspect) => {
                  const progress = Math.min(100, (aspect.actual / aspect.target) * 100);
                  return (
                    <span key={aspect.id} className={`${aspect.actual > aspect.target ? "satisfaction-segment is-over" : "satisfaction-segment"}${aspect.parts.length ? " has-parts" : ""}`} style={{ "--aspect-color": aspect.color, flexGrow: aspect.target } as React.CSSProperties} title={`${aspect.name}: ${aspect.actual} из ${aspect.target} мин`}>
                      {aspect.parts.length ? aspect.parts.map((part) => {
                        const partKey = `${aspect.id}-${part.id}`;
                        return (
                        <button key={part.id} type="button" className={part.actualMinutes > part.targetMinutes ? "satisfaction-part is-over" : "satisfaction-part"} style={{ flexGrow: part.targetMinutes }} aria-label={`${aspect.name}, ${part.name}: ${part.actualMinutes} из ${part.targetMinutes} минут`} onMouseEnter={() => setActiveSatisfactionPart(partKey)} onMouseLeave={() => setActiveSatisfactionPart(null)} onFocus={() => setActiveSatisfactionPart(partKey)} onBlur={() => setActiveSatisfactionPart(null)} onClick={() => setActiveSatisfactionPart(partKey)}>
                          <span className="satisfaction-part-fill" style={{ width: `${Math.min(100, (part.actualMinutes / part.targetMinutes) * 100)}%` }} />
                        </button>
                      );}) : <span className="satisfaction-fill" style={{ width: `${progress}%` }} />}
                    </span>
                  );
                })}
              </div>
              <div className="satisfaction-summary">
                <span>Сбалансированное выполнение: <strong>{creditedDailyMinutes} из {totalDailyTarget} мин</strong></span>
                {dailyOverflow > 0 && <span className="is-over">+{dailyOverflow} мин сверх отдельных норм · {totalDailyPercent}% всего времени</span>}
              </div>
              <div className="satisfaction-legend">
                {targetedDailyAspects.map((aspect) => (
                  <button key={aspect.id} type="button" onClick={() => openAspect(aspect.id)} style={{ "--aspect-color": aspect.color } as React.CSSProperties}>
                    <span /><div><strong>{aspect.name}</strong><small>{aspect.actual} / {aspect.target} мин{aspect.parts.length ? ` · ${aspect.parts.length} части` : ""}</small></div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="satisfaction-empty"><Gauge className="size-6" /><div><strong>Задайте дневные нормы</strong><span>Откройте любой аспект и укажите, сколько минут хотите уделять ему каждый день.</span></div></div>
          )}
        </section>

        <div className="development-overview">
          {LIFE_ASPECT_GROUPS.map((group) => (
            <section key={group.id} className="development-group">
              <div className="development-group-head">
                <div><span>{group.name}</span><small>{group.description}</small></div>
                <span>{group.aspectIds.length}</span>
              </div>
              <div className="development-aspect-grid">
                {group.aspectIds.map((id) => {
                  const aspect = systems.find((item) => item.id === id);
                  if (!aspect) return null;
                  const visionCount = identitySystemIdeas.filter((idea) => idea.aspectId === id).length;
                  const blockCount = blocks.filter((block) => colorBelongsToLifeAspect(block.color, aspect.id)).length;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => openAspect(id)}
                      className="development-aspect-card"
                      style={{ "--aspect-color": aspect.color } as React.CSSProperties}
                    >
                      <span className="development-aspect-color" />
                      <span className="development-aspect-copy">
                        <strong>{aspect.name}</strong>
                        <small>{visionCount ? `${visionCount} пункт${visionCount === 1 ? "" : "а"} видения` : "Добавьте видение"}</small>
                      </span>
                      {blockCount > 0 && <span className="development-aspect-count"><Layers3 className="size-3.5" /> {blockCount}</span>}
                      <ChevronRight className="size-5 development-aspect-arrow" />
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="development-page development-detail" style={{ "--aspect-color": selectedAspect.color } as React.CSSProperties}>
      <button type="button" className="development-back" onClick={closeAspect}><ArrowLeft className="size-4" /> Все аспекты</button>
      <div className="development-detail-hero">
        <span className="development-detail-mark">{selectedAspect.id.padStart(2, "0")}</span>
        <div><span>Аспект жизни</span><h1>{selectedAspect.name}</h1><p className="development-year-total"><Clock3 className="size-4" /><strong>{yearlyAspectMinutes.toLocaleString("ru-RU")}</strong><span>минут за {currentYear} год</span></p></div>
        <div className="development-daily-target">
          <button type="button" onClick={startEditingDailyTarget}><span>Норма дня</span><strong>{selectedAspect.dailyTargetMinutes ? `${selectedAspect.dailyTargetMinutes} мин${selectedAspect.dailyParts?.length ? ` · ${selectedAspect.dailyParts.length} части` : ""}` : "Не задана"}</strong><Pencil className="size-3.5" /></button>
        </div>
        <Compass className="development-detail-icon" />
      </div>

      <AnimatePresence>
        {editingDailyTarget && (
          <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="development-target-editor">
            <div className="development-target-editor-head"><div><strong>Дневная норма</strong><span>Каждая часть заполняется только временем одноимённого занятия в таймере.</span></div><button type="button" onClick={cancelEditingDailyTarget} aria-label="Закрыть"><X className="size-4" /></button></div>
            {!dailyPartsDraft.length && (
              <label className="development-target-total"><span>Общая норма</span><div><input autoFocus type="number" min="0" max="1440" inputMode="numeric" value={dailyTargetDraft} onChange={(event) => setDailyTargetDraft(event.target.value)} placeholder="90" /><small>минут в день</small></div></label>
            )}
            {dailyPartsDraft.length > 0 && (
              <div className="development-target-parts">
                {dailyPartsDraft.map((part, index) => (
                  <div key={part.id} className="development-target-part">
                    <span>{index + 1}</span>
                    <input autoFocus={index === dailyPartsDraft.length - 1} type="text" value={part.name} onChange={(event) => updateDailyPart(part.id, { name: event.target.value })} placeholder="Например, История" aria-label="Название части" />
                    <label><input type="number" min="1" max="1440" inputMode="numeric" value={part.targetMinutes} onChange={(event) => updateDailyPart(part.id, { targetMinutes: Number(event.target.value) })} aria-label={`Минут для ${part.name || "части"}`} /><small>мин</small></label>
                    <label className="development-target-reward"><Coins className="size-3.5" /><input type="number" min="0" step="0.01" inputMode="decimal" value={part.rewardPerMinute ?? ""} onChange={(event) => updateDailyPart(part.id, { rewardPerMinute: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder="0,1" aria-label={`Монет за минуту для ${part.name || "части"}`} /><small>за мин</small></label>
                    <button type="button" onClick={() => setDailyPartsDraft((parts) => parts.filter((item) => item.id !== part.id))} aria-label="Удалить часть"><Trash2 className="size-4" /></button>
                  </div>
                ))}
                <div className="development-target-parts-total"><span>Общая норма</span><strong>{dailyPartsDraft.reduce((sum, part) => sum + Math.max(0, Number(part.targetMinutes) || 0), 0)} мин</strong></div>
              </div>
            )}
            <div className="development-target-editor-actions"><button type="button" className="development-target-add-part" onClick={addDailyPart}><Plus className="size-4" /> {dailyPartsDraft.length ? "Добавить ещё часть" : "Разделить на части"}</button><div><button type="button" onClick={cancelEditingDailyTarget}>Отмена</button><button type="button" className="app-button" onClick={saveDailyTarget}><Check className="size-4" /> Сохранить</button></div></div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="development-section vision-section">
        <div className="development-section-head">
          <div className="development-section-title"><span><Sparkles className="size-5" /></span><div><h2>Видение</h2><p>Каким вы хотите быть и к какому состоянию прийти</p></div></div>
          <button type="button" className="development-add" onClick={startAddingVision} aria-label="Добавить пункт видения"><Plus className="size-5" /> <span>Добавить</span></button>
        </div>

        <AnimatePresence>
          {showVisionForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="vision-form">
              <div className="vision-form-heading"><Pencil className="size-4" /><strong>{editingVisionId ? "Редактировать пункт видения" : "Новый пункт видения"}</strong></div>
              <label><span>Каким я должен быть</span><textarea autoFocus value={visionText} onChange={(event) => setVisionText(event.target.value)} placeholder="Например: я спокойно выступаю перед большой аудиторией" rows={3} /></label>
              <label><span>Дедлайн</span><input type="date" value={visionDeadline} onChange={(event) => setVisionDeadline(event.target.value)} /></label>
              <div className="vision-form-actions"><button type="button" onClick={closeVisionForm}>Отмена</button><button type="button" className="app-button" disabled={!visionText.trim() || !visionDeadline} onClick={saveVision}><Check className="size-4" /> {editingVisionId ? "Обновить" : "Сохранить"}</button></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="vision-list">
          {visions.map((vision) => (
            <motion.article layout key={vision.id} className={vision.completed ? "vision-item is-completed" : "vision-item"}>
              <button type="button" className="vision-check" onClick={() => updateIdentitySystemIdea(vision.id, { completed: !vision.completed })} aria-label={vision.completed ? "Вернуть пункт" : "Отметить выполненным"}>{vision.completed && <Check className="size-4" />}</button>
              <div className="vision-item-copy"><p>{vision.text}</p><div><span><CalendarDays className="size-3.5" /> {formatDeadline(vision.deadline)}</span>{vision.deadline && <span>{getDeadlineState(vision.deadline)}</span>}</div></div>
              <button type="button" className="vision-goal-add" onClick={() => startAddingGoal(vision.id)} aria-label="Добавить цель к этому видению"><Target className="size-4" /></button>
              <button type="button" className="vision-edit" onClick={() => startEditingVision(vision)} aria-label="Редактировать пункт"><Pencil className="size-4" /></button>
              <button type="button" className="vision-delete" onClick={() => { deleteIdentitySystemIdea(vision.id); if (editingVisionId === vision.id) closeVisionForm(); }} aria-label="Удалить пункт"><Trash2 className="size-4" /></button>
            </motion.article>
          ))}
          {!visions.length && !showVisionForm && <button type="button" className="vision-empty" onClick={startAddingVision}><Plus className="size-5" /><span><strong>Добавьте первый пункт видения</strong><small>Опишите конкретное состояние и назначьте срок</small></span></button>}
        </div>
      </section>

      <section className="development-section aspect-goals-section">
        <div className="development-section-head">
          <div className="development-section-title"><span><Target className="size-5" /></span><div><h2>Цели</h2><p>{aspectGoals.length ? `Сегодня есть движение по ${aspectGoals.filter((goal) => getGoalProgressForDate(goal, activitySessions, todayString) > 0).length} из ${aspectGoals.length} целей` : "Конкретные результаты, через которые вы воплощаете своё видение"}</p></div></div>
          <button type="button" className="development-add" onClick={() => startAddingGoal()} aria-label="Добавить цель"><Plus className="size-5" /> <span>Добавить</span></button>
        </div>

        <AnimatePresence>
          {showGoalForm && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="aspect-goal-form">
              <div className="aspect-goal-form-heading"><Target className="size-4" /><strong>{editingGoalId ? "Редактировать цель" : "Новая цель"}</strong><span>Через что я достигну желаемого состояния</span></div>
              <label className="is-wide"><span>Название цели</span><input autoFocus value={goalName} onChange={(event) => setGoalName(event.target.value)} placeholder="Например: держать норму 2200 ккал" /></label>
              <div className="aspect-goal-picker"><EmojiPicker label="Иконка" value={goalEmoji} onChange={setGoalEmoji} /></div>
              <div className="aspect-goal-picker"><span>Цвет</span><AdvancedColorPicker value={goalColor || selectedAspect.color} onChange={setGoalColor} /></div>
              <label><span>Папка</span><select value={goalFolder} onChange={(event) => setGoalFolder(event.target.value)}>{goalFolders.map((folder) => <option key={folder.id} value={folder.id}>{folder.emoji || "🏆"} {folder.name}</option>)}</select></label>
              <label><span>Награда</span><input type="number" min="0" value={goalCoins} onChange={(event) => setGoalCoins(event.target.value)} placeholder="100" /></label>
              <label className="is-wide"><span>Описание</span><input value={goalDescription} onChange={(event) => setGoalDescription(event.target.value)} placeholder="Что именно должно измениться" /></label>
              <label className="is-wide"><span>Как считать прогресс</span><select value={goalProgressType} onChange={(event) => setGoalProgressType(event.target.value as "manual" | "activity_minutes")}><option value="manual">Добавлять значение вручную</option><option value="activity_minutes">Автоматически в минутах из таймера</option></select></label>
              {goalProgressType === "activity_minutes" && <label className="is-wide"><span>Название занятия в таймере</span><input list="aspect-goal-activity-options" value={goalActivityName} onChange={(event) => setGoalActivityName(event.target.value)} placeholder="Например: Чтение" /><datalist id="aspect-goal-activity-options">{knownActivityNames.map((title) => <option key={title} value={title} />)}</datalist><small>В цель пойдут только минуты занятия с этим названием.</small></label>}
              <label><span>{goalProgressType === "activity_minutes" ? "Цель в минутах" : "Целевое значение"}</span><input type="number" min="1" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} /></label>
              {goalProgressType === "manual" && <label><span>Единица</span><input value={goalUnit} onChange={(event) => setGoalUnit(event.target.value)} placeholder="ккал, кг, страниц" /></label>}
              <label><span>Дедлайн</span><input type="date" value={goalDeadline} onChange={(event) => setGoalDeadline(event.target.value)} /></label>
              <label><span>Связать с видением</span><select value={goalVisionId} onChange={(event) => setGoalVisionId(event.target.value)}><option value="">Со всем аспектом</option>{visions.map((vision) => <option key={vision.id} value={vision.id}>{vision.text}</option>)}</select></label>
              <div className="aspect-goal-form-actions"><button type="button" onClick={closeGoalForm}>Отмена</button><button type="button" className="app-button" disabled={!goalName.trim() || !Number(goalTarget) || (goalProgressType === "activity_minutes" && !goalActivityName.trim())} onClick={saveAspectGoal}><Check className="size-4" /> {editingGoalId ? "Обновить" : "Создать цель"}</button></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="aspect-goal-list">
          {aspectGoals.map((goal) => {
            const progress = Math.min(100, Math.max(0, goal.targetValue > goal.startValue ? ((goal.currentValue - goal.startValue) / (goal.targetValue - goal.startValue)) * 100 : 0));
            const linkedVision = visions.find((vision) => vision.id === goal.visionId);
            return (
              <article key={goal.id} className={goal.completed ? "aspect-goal-card is-completed" : "aspect-goal-card"}>
                <div className="aspect-goal-card-top"><span>{goal.emoji || <Target className="size-5" />}</span><div><strong>{goal.name}</strong><small>{goal.description || "Конкретный шаг к видению"}</small></div><b>{Math.round(progress)}%</b></div>
                {linkedVision && <p className="aspect-goal-vision"><Sparkles className="size-3.5" /> {linkedVision.text}</p>}
                <div className="aspect-goal-progress-copy"><span>{goal.currentValue.toLocaleString("ru-RU")} / {goal.targetValue.toLocaleString("ru-RU")} {getGoalProgressUnit(goal)}</span>{goal.deadline && <span><CalendarDays className="size-3" /> {formatDeadline(goal.deadline)}</span>}</div>
                <div className="aspect-goal-progress"><i style={{ width: `${progress}%` }} /></div>
                <p className={getGoalProgressForDate(goal, activitySessions, todayString) > 0 ? "aspect-goal-today has-progress" : "aspect-goal-today"}><span><Sparkles className="size-3.5" /> Сегодня к успеху</span><strong>+{getGoalProgressForDate(goal, activitySessions, todayString).toLocaleString("ru-RU")} {getGoalProgressUnit(goal)}</strong></p>
                <div className="aspect-goal-actions"><Link href="/goals">Заполнять на странице целей <ChevronRight className="size-3.5" /></Link><button type="button" onClick={() => startEditingGoal(goal)} aria-label="Редактировать цель"><Pencil className="size-4" /></button><button type="button" onClick={() => deleteGoal(goal.id)} aria-label="Удалить цель"><Trash2 className="size-4" /></button></div>
              </article>
            );
          })}
          {!aspectGoals.length && !showGoalForm && <button type="button" className="aspect-goal-empty" onClick={() => startAddingGoal()}><Target className="size-5" /><span><strong>Добавьте первую цель</strong><small>Превратите видение в измеримый результат</small></span></button>}
        </div>
      </section>

      <section className="development-section tools-section">
        <div className="development-section-head">
          <div className="development-section-title"><span><Wrench className="size-5" /></span><div><h2>Инструменты</h2><p>Практики и опоры для развития этой сферы</p></div></div>
          <span className={selectedAspect.id === "10" ? "development-soon is-ready" : "development-soon"}>{selectedAspect.id === "10" ? "Доступно" : "Скоро"}</span>
        </div>
        {selectedAspect.id === "10" ? (
          <div className="study-tools-categories">
            <section className="study-tool-category">
              <div className="study-tool-category-head"><span><Headphones className="size-5" /></span><div><h3>Английский</h3><p>Слова и понимание речи</p></div><small>2 инструмента</small></div>
              <div className="study-tools-grid">
                <a className="study-tool-card" href="https://den-english-10000.tivishka.chatgpt.site/" target="_blank" rel="noreferrer">
                  <span className="study-tool-icon"><BookOpenText className="size-7" /></span>
                  <span className="study-tool-copy"><small>Словарный запас</small><strong>10 000 английских слов</strong><span>Повторяйте слова и постепенно расширяйте словарный запас.</span></span>
                  <span className="study-tool-open">Открыть <ExternalLink className="size-4" /></span>
                </a>
                <a className="study-tool-card" href="https://kinogomy.net/cartoons/555-griffiny-hd-mvisionstv13-v54.html" target="_blank" rel="noreferrer">
                  <span className="study-tool-icon"><Headphones className="size-7" /></span>
                  <span className="study-tool-copy"><small>Аудирование</small><strong>Слушанье Гриффинов</strong><span>Тренируйте понимание живой английской речи на слух.</span></span>
                  <span className="study-tool-open">Смотреть <ExternalLink className="size-4" /></span>
                </a>
              </div>
            </section>
            <section className="study-tool-category">
              <div className="study-tool-category-head"><span><Globe2 className="size-5" /></span><div><h3>История</h3><p>События и связи прошлого</p></div><small>1 инструмент</small></div>
              <div className="study-tools-grid">
                <a className="study-tool-card" href="https://new.artforintrovert.ru/course/vsemirnaya-istoriya" target="_blank" rel="noreferrer">
                  <span className="study-tool-icon"><Globe2 className="size-7" /></span>
                  <span className="study-tool-copy"><small>Онлайн-курс</small><strong>История мира</strong><span>Изучайте ключевые события и связи всемирной истории.</span></span>
                  <span className="study-tool-open">Перейти <ExternalLink className="size-4" /></span>
                </a>
              </div>
            </section>
            <section className="study-tool-category">
              <div className="study-tool-category-head"><span><BookMarked className="size-5" /></span><div><h3>Книги</h3><p>Главные произведения на всю жизнь</p></div><small>1 инструмент</small></div>
              <div className="study-tools-grid">
                <a className="study-tool-card" href="https://sto-knig-na-vsyu-zhizn.tivishka.chatgpt.site/" target="_blank" rel="noreferrer">
                  <span className="study-tool-icon"><BookMarked className="size-7" /></span>
                  <span className="study-tool-copy"><small>Список для чтения</small><strong>100 книг на всю жизнь</strong><span>Выбирайте важные книги, отмечайте прочитанное и двигайтесь по списку.</span></span>
                  <span className="study-tool-open">Открыть <ExternalLink className="size-4" /></span>
                </a>
              </div>
            </section>
            <section className="study-tool-category">
              <div className="study-tool-category-head"><span><MapPinned className="size-5" /></span><div><h3>География</h3><p>Страны и карта мира</p></div><small>1 инструмент</small></div>
              <div className="study-tools-grid">
                <a className="study-tool-card" href="https://karta-znaniy-mira.tivishka.chatgpt.site/" target="_blank" rel="noreferrer">
                  <span className="study-tool-icon"><MapPinned className="size-7" /></span>
                  <span className="study-tool-copy"><small>Интерактивная карта</small><strong>Карта знаний мира</strong><span>Изучайте страны, их расположение и постепенно собирайте картину мира.</span></span>
                  <span className="study-tool-open">Изучать <ExternalLink className="size-4" /></span>
                </a>
              </div>
            </section>
          </div>
        ) : <div className="tools-placeholder"><Wrench className="size-5" /><p><strong>Здесь появятся ваши инструменты</strong><span>Мы добавим их отдельно под каждый аспект.</span></p></div>}
      </section>

      <section className="development-section blocks-section">
        <div className="development-section-head">
          <div className="development-section-title"><span><BriefcaseBusiness className="size-5" /></span><div><h2>Блоки на сегодня</h2><p>Дневные блоки цвета «{selectedAspect.name}»</p></div></div>
          <Link href="/goals" className="development-manage">Настроить</Link>
        </div>
        <div className="aspect-block-list">
          {aspectBlocks.map((block) => {
            const habitCount = habits.filter((habit) => habit.blockId === block.id).length;
            const taskCount = tasks.filter((task) => task.blockId === block.id).length;
            return (
              <article key={block.id} className="aspect-block-item">
                <span className="aspect-block-time"><Clock3 className="size-4" />{block.startTime || "—:—"}<small>{block.endTime || "—:—"}</small></span>
                <div><strong>{block.name}</strong><small>{habitCount} привычек · {taskCount} задач</small></div>
                <Layers3 className="size-5" />
              </article>
            );
          })}
          {!aspectBlocks.length && <div className="aspect-block-empty"><Layers3 className="size-5" /><p><strong>На сегодня блоков нет</strong><span>Назначьте блоку цвет «{selectedAspect.name}», и он появится здесь.</span></p></div>}
        </div>
      </section>
    </PageShell>
  );
}
