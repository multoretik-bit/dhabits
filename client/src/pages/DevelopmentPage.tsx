import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  Gauge,
  Layers3,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { nanoid } from "nanoid";
import { PageHeader, PageShell } from "@/components/AppUI";
import { useApp } from "@/contexts/AppContext";
import { colorBelongsToLifeAspect, getTimerMinutesForAspectInYear, getTimerMinutesForAspectOnDate, getTimerMinutesForAspectPartsOnDate, LIFE_ASPECT_GROUPS, LIFE_ASPECTS, type LifeAspectDailyPart } from "@/lib/lifeAspects";

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
  } = useApp();
  const [selectedAspectId, setSelectedAspectId] = useState<string | null>(null);
  const [showVisionForm, setShowVisionForm] = useState(false);
  const [visionText, setVisionText] = useState("");
  const [visionDeadline, setVisionDeadline] = useState(getDefaultDeadline);
  const [editingVisionId, setEditingVisionId] = useState<string | null>(null);
  const [editingDailyTarget, setEditingDailyTarget] = useState(false);
  const [dailyTargetDraft, setDailyTargetDraft] = useState("");
  const [dailyPartsDraft, setDailyPartsDraft] = useState<LifeAspectDailyPart[]>([]);

  const systems = useMemo(() => LIFE_ASPECTS.map((fallback) => {
    const saved = identitySystems.find((system) => system.id === fallback.id);
    return { ...fallback, ...saved, name: saved?.aspect || fallback.name, color: fallback.color };
  }), [identitySystems]);
  const selectedAspect = systems.find((aspect) => aspect.id === selectedAspectId);
  const visions = identitySystemIdeas.filter((idea) => idea.aspectId === selectedAspectId);
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
      .map((part) => ({ ...part, name: part.name.trim(), targetMinutes: Math.min(1440, Math.max(0, Math.round(Number(part.targetMinutes) || 0))) }))
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
              <div className="satisfaction-track" aria-label={`Шкала удовлетворения заполнена на ${satisfactionPercent}%`}>
                {targetedDailyAspects.map((aspect) => {
                  const progress = Math.min(100, (aspect.actual / aspect.target) * 100);
                  return (
                    <span key={aspect.id} className={`${aspect.actual > aspect.target ? "satisfaction-segment is-over" : "satisfaction-segment"}${aspect.parts.length ? " has-parts" : ""}`} style={{ "--aspect-color": aspect.color, flexGrow: aspect.target } as React.CSSProperties} title={`${aspect.name}: ${aspect.actual} из ${aspect.target} мин`}>
                      {aspect.parts.length ? aspect.parts.map((part) => (
                        <span key={part.id} className={part.actualMinutes > part.targetMinutes ? "satisfaction-part is-over" : "satisfaction-part"} style={{ flexGrow: part.targetMinutes }} title={`${part.name}: ${part.actualMinutes} из ${part.targetMinutes} мин`}>
                          <span className="satisfaction-part-fill" style={{ width: `${Math.min(100, (part.actualMinutes / part.targetMinutes) * 100)}%` }} />
                        </span>
                      )) : <span className="satisfaction-fill" style={{ width: `${progress}%` }} />}
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
              {targetedDailyAspects.some((aspect) => aspect.parts.length > 0) && (
                <div className="satisfaction-parts-breakdown">
                  {targetedDailyAspects.flatMap((aspect) => aspect.parts.map((part) => (
                    <span key={`${aspect.id}-${part.id}`} style={{ "--aspect-color": aspect.color } as React.CSSProperties}><i />{part.name}<strong>{part.actualMinutes} / {part.targetMinutes}</strong></span>
                  )))}
                </div>
              )}
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
            <div className="development-target-editor-head"><div><strong>Дневная норма</strong><span>Оставьте одну общую норму или разделите её на занятия.</span></div><button type="button" onClick={cancelEditingDailyTarget} aria-label="Закрыть"><X className="size-4" /></button></div>
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
              <button type="button" className="vision-edit" onClick={() => startEditingVision(vision)} aria-label="Редактировать пункт"><Pencil className="size-4" /></button>
              <button type="button" className="vision-delete" onClick={() => { deleteIdentitySystemIdea(vision.id); if (editingVisionId === vision.id) closeVisionForm(); }} aria-label="Удалить пункт"><Trash2 className="size-4" /></button>
            </motion.article>
          ))}
          {!visions.length && !showVisionForm && <button type="button" className="vision-empty" onClick={startAddingVision}><Plus className="size-5" /><span><strong>Добавьте первый пункт видения</strong><small>Опишите конкретное состояние и назначьте срок</small></span></button>}
        </div>
      </section>

      <section className="development-section tools-section">
        <div className="development-section-head">
          <div className="development-section-title"><span><Wrench className="size-5" /></span><div><h2>Инструменты</h2><p>Практики и опоры для развития этой сферы</p></div></div>
          <span className={selectedAspect.id === "10" ? "development-soon is-ready" : "development-soon"}>{selectedAspect.id === "10" ? "Доступно" : "Скоро"}</span>
        </div>
        {selectedAspect.id === "10" ? (
          <a className="study-tool-card" href="https://den-english-10000.tivishka.chatgpt.site/" target="_blank" rel="noreferrer">
            <span className="study-tool-icon"><BookOpenText className="size-7" /></span>
            <span className="study-tool-copy"><small>English vocabulary</small><strong>10 000 английских слов</strong><span>Открывайте тренажёр, повторяйте слова и расширяйте словарный запас.</span></span>
            <span className="study-tool-open">Открыть <ExternalLink className="size-4" /></span>
          </a>
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
