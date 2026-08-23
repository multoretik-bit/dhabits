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
  Layers3,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { Link } from "wouter";
import { PageHeader, PageShell } from "@/components/AppUI";
import { useApp } from "@/contexts/AppContext";
import { colorBelongsToLifeAspect, getTimerActivityAspectId, LIFE_ASPECT_GROUPS, LIFE_ASPECTS } from "@/lib/lifeAspects";

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

  const systems = LIFE_ASPECTS.map((fallback) => {
    const saved = identitySystems.find((system) => system.id === fallback.id);
    return { ...fallback, ...saved, name: saved?.aspect || fallback.name, color: fallback.color };
  });
  const selectedAspect = systems.find((aspect) => aspect.id === selectedAspectId);
  const visions = identitySystemIdeas.filter((idea) => idea.aspectId === selectedAspectId);
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekday = today.getDay();
  const currentYear = today.getFullYear();

  const yearlyAspectMinutes = useMemo(() => {
    if (!selectedAspect) return 0;
    const totalSeconds = activitySessions.reduce((sum, session) => {
      const sessionYear = Number(session.date?.slice(0, 4)) || new Date(session.endedAt).getFullYear();
      if (sessionYear !== currentYear || getTimerActivityAspectId(session.title, session.color) !== selectedAspect.id) return sum;
      return sum + Math.max(0, session.durationSeconds || 0);
    }, 0);
    return Math.floor(totalSeconds / 60);
  }, [activitySessions, currentYear, selectedAspect]);

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

  if (!selectedAspect) {
    return (
      <PageShell className="development-page">
        <PageHeader
          eyebrow="Долгосрочная система"
          title="Развитие"
          description="Десять аспектов жизни связывают ваше видение с тем, что вы реально делаете каждый день. Выберите сферу, чтобы увидеть её направление и дневные блоки."
        />

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
                      onClick={() => setSelectedAspectId(id)}
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
      <button type="button" className="development-back" onClick={() => setSelectedAspectId(null)}><ArrowLeft className="size-4" /> Все аспекты</button>
      <div className="development-detail-hero">
        <span className="development-detail-mark">{selectedAspect.id.padStart(2, "0")}</span>
        <div><span>Аспект жизни</span><h1>{selectedAspect.name}</h1><p className="development-year-total"><Clock3 className="size-4" /><strong>{yearlyAspectMinutes.toLocaleString("ru-RU")}</strong><span>минут за {currentYear} год</span></p></div>
        <Compass className="development-detail-icon" />
      </div>

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
