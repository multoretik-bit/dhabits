import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ChevronDown, Clock3, Pause, Play, Plus, RotateCcw, Square, TimerReset, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import {
  useApp,
  type ActivitySession,
  type ActivityTimerState,
} from "@/contexts/AppContext";
import { formatDateToDateString } from "@/lib/dateUtils";
import AdvancedColorPicker from "@/components/AdvancedColorPicker";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";
import { EmptyState, SectionHeading } from "@/components/AppUI";
import { groupActivitySessionsByTitle } from "@/lib/activitySessions";

function getElapsedSeconds(timer: ActivityTimerState, now: number) {
  const runningSeconds = timer.isRunning && timer.startedAt
    ? Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000))
    : 0;
  return Math.max(0, timer.accumulatedSeconds + runningSeconds);
}

function formatClock(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return "0 мин";
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${minutes} мин`;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatSessionCount(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  const word = lastTwo >= 11 && lastTwo <= 14
    ? "сессий"
    : last === 1
      ? "сессия"
      : last >= 2 && last <= 4
        ? "сессии"
        : "сессий";
  return `${count} ${word}`;
}

export default function PomodoroTracker({ selectedDate }: { selectedDate: Date }) {
  const {
    activitySessions,
    activityTimer,
    saveActivityTimer,
    addActivitySession,
    deleteActivitySession,
  } = useApp();
  const [now, setNow] = useState(Date.now());
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isManualSessionModalOpen, setIsManualSessionModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionColor, setSessionColor] = useState("#315cff");
  const [manualTitle, setManualTitle] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualColor, setManualColor] = useState("#315cff");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!activityTimer.isRunning) return;
    const updateNow = () => setNow(Date.now());
    const timerId = window.setInterval(updateNow, 1000);
    document.addEventListener("visibilitychange", updateNow);
    return () => {
      window.clearInterval(timerId);
      document.removeEventListener("visibilitychange", updateNow);
    };
  }, [activityTimer.isRunning]);

  const elapsedSeconds = getElapsedSeconds(activityTimer, now);
  const progress = ((elapsedSeconds % 3600) / 3600) * 100;

  const selectedDateString = formatDateToDateString(selectedDate);
  const dailySessions = useMemo(
    () => activitySessions
      .filter((session) => session.date === selectedDateString)
      .sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
    [activitySessions, selectedDateString]
  );

  const groupedTotals = useMemo(() => groupActivitySessionsByTitle(dailySessions), [dailySessions]);

  const totalDaySeconds = dailySessions.reduce((sum, session) => sum + session.durationSeconds, 0);
  const hasActiveTime = elapsedSeconds > 0;
  const activityTitles = useMemo(() => {
    const titles = new Map<string, string>();
    activitySessions.forEach((session) => {
      const title = session.title.trim();
      if (title) titles.set(title.toLocaleLowerCase("ru-RU"), title);
    });
    return Array.from(titles.values()).sort((a, b) => a.localeCompare(b, "ru-RU"));
  }, [activitySessions]);

  const startTimer = () => {
    if (activityTimer.isRunning) return;
    setNow(Date.now());
    saveActivityTimer({ ...activityTimer, isRunning: true, startedAt: new Date().toISOString() });
  };

  const pauseTimer = () => {
    if (!activityTimer.isRunning) return;
    const nextElapsed = getElapsedSeconds(activityTimer, Date.now());
    saveActivityTimer({
      ...activityTimer,
      isRunning: false,
      startedAt: undefined,
      accumulatedSeconds: nextElapsed,
    });
    setNow(Date.now());
  };

  const finishTimer = () => {
    if (!hasActiveTime) return;
    if (activityTimer.isRunning) pauseTimer();
    setIsSessionModalOpen(true);
  };

  const resetTimer = () => {
    saveActivityTimer({
      ...activityTimer,
      isRunning: false,
      startedAt: undefined,
      accumulatedSeconds: 0,
    });
    setNow(Date.now());
  };

  const saveSession = (event: React.FormEvent) => {
    event.preventDefault();
    const title = sessionTitle.trim();
    const durationSeconds = getElapsedSeconds(activityTimer, Date.now());
    if (!title || durationSeconds < 1) return;

    const endedAt = new Date();
    const session: ActivitySession = {
      id: nanoid(),
      date: formatDateToDateString(endedAt),
      title,
      color: sessionColor,
      startedAt: new Date(endedAt.getTime() - durationSeconds * 1000).toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds,
      createdAt: new Date().toISOString(),
    };

    addActivitySession(session);
    setSessionTitle("");
    setIsSessionModalOpen(false);
    setNow(Date.now());
  };

  const saveManualSession = (event: React.FormEvent) => {
    event.preventDefault();
    const title = manualTitle.trim();
    const minutes = Number.parseFloat(manualMinutes.replace(",", "."));
    if (!title || !Number.isFinite(minutes) || minutes <= 0) return;

    const nowDate = new Date();
    const endedAt = new Date(selectedDate);
    endedAt.setHours(nowDate.getHours(), nowDate.getMinutes(), nowDate.getSeconds(), nowDate.getMilliseconds());
    const durationSeconds = Math.max(1, Math.round(minutes * 60));
    addActivitySession({
      id: nanoid(),
      date: selectedDateString,
      title,
      color: manualColor,
      startedAt: new Date(endedAt.getTime() - durationSeconds * 1000).toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds,
      createdAt: new Date().toISOString(),
    }, { preserveTimer: true });
    setManualTitle("");
    setManualMinutes("");
    setIsManualSessionModalOpen(false);
  };

  const timerStyle = { "--timer-progress": `${progress * 3.6}deg` } as CSSProperties;

  return (
    <>
      <section className="app-surface pomodoro-panel">
        <SectionHeading icon={TimerReset} title="Таймер занятий" meta={activityTimer.isRunning ? "Идёт" : hasActiveTime ? "Пауза" : "Готов"} />
        <p className="pomodoro-hint">Запустите таймер, а после завершения укажите, чем занимались. Время сохранится в итогах дня и связанных целях.</p>
        <div className="pomodoro-day-total">
          <Clock3 className="size-4" />
          <div><span>Всего за {selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</span><strong>{formatDuration(totalDaySeconds)}</strong></div>
          <small>{formatSessionCount(dailySessions.length)}</small>
        </div>

        <div className={`pomodoro-clock ${activityTimer.isRunning ? "is-running" : ""}`} style={timerStyle}>
          <div>
            <span>{activityTimer.isRunning ? "В фокусе" : hasActiveTime ? "На паузе" : "Готов"}</span>
            <strong>{formatClock(elapsedSeconds)}</strong>
            <small>Фактическое время занятия</small>
          </div>
        </div>

        <div className="pomodoro-actions">
          {activityTimer.isRunning ? (
            <button type="button" className="app-button" onClick={pauseTimer}><Pause className="size-4" /> Пауза</button>
          ) : (
            <button type="button" className="app-button" onClick={startTimer}><Play className="size-4" /> {hasActiveTime ? "Продолжить" : "Старт"}</button>
          )}
          <button type="button" className="app-button is-secondary" onClick={finishTimer} disabled={!hasActiveTime}><Square className="size-4" /> Завершить</button>
          <button type="button" className="icon-button" onClick={resetTimer} disabled={!hasActiveTime} aria-label="Сбросить таймер"><RotateCcw className="size-4" /></button>
        </div>

        <div className="activity-day-head">
          <div>
            <span>Итоги дня</span>
            <strong>{selectedDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</strong>
          </div>
          <div className="activity-day-actions">
            <button type="button" className="app-button is-secondary activity-manual-button" onClick={() => setIsManualSessionModalOpen(true)}><Plus className="size-4" /> Добавить минуты</button>
            <b>{formatDuration(totalDaySeconds || 0)}</b>
          </div>
        </div>

        {groupedTotals.length > 0 ? (
          <div className="activity-totals">
            {groupedTotals.map((item) => (
              <article key={item.key} className={`activity-group ${expandedGroups[item.key] ? "is-expanded" : ""}`} style={{ "--activity-color": item.color } as CSSProperties}>
                <button
                  type="button"
                  className="activity-group-summary"
                  onClick={() => setExpandedGroups(current => ({ ...current, [item.key]: !current[item.key] }))}
                  aria-expanded={Boolean(expandedGroups[item.key])}
                  aria-label={`${expandedGroups[item.key] ? "Скрыть" : "Показать"} сессии занятия ${item.title}`}
                >
                  <i className="activity-group-dot" />
                  <div><strong>{item.title}</strong><span>{formatSessionCount(item.sessions.length)}</span></div>
                  <b>{formatDuration(item.seconds)}</b>
                  <ChevronDown className="activity-group-chevron size-4" />
                </button>
                {expandedGroups[item.key] && (
                  <div className="activity-group-sessions">
                    {item.sessions.map((session) => (
                      <div key={session.id} className="activity-session-row">
                        <div><Clock3 className="size-3" /><span>{formatTime(session.startedAt)}–{formatTime(session.endedAt)}</span></div>
                        <b>{formatDuration(session.durationSeconds)}{session.earnedCoins ? ` · +${session.earnedCoins.toLocaleString("ru-RU")} мон.` : ""}</b>
                        <button type="button" className="icon-button is-small subtle-danger" onClick={() => deleteActivitySession(session.id)} aria-label={`Удалить сессию ${session.title}`}><Trash2 className="size-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : <EmptyState compact title="Пока нет занятий" description="Завершённые занятия появятся здесь и сохранятся в вашем аккаунте." />}
      </section>

      <FormModal
        title="Записать занятие"
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        onSubmit={saveSession}
        submitText="Сохранить занятие"
      >
        <div className="pomodoro-session-summary">
          <Clock3 className="size-5" />
          <div><span>Продолжительность</span><strong>{formatDuration(getElapsedSeconds(activityTimer, Date.now()))}</strong></div>
        </div>
        <p className="pomodoro-hint">Название объединит одинаковые занятия в один итог и свяжет время с подходящей целью.</p>
        <FormInput label="Чем занимались" value={sessionTitle} onChange={setSessionTitle} placeholder="Например, Чтение" list="activity-title-options" />
        <AdvancedColorPicker label="Цвет занятия" value={sessionColor} onChange={setSessionColor} />
      </FormModal>

      <FormModal
        title="Добавить время вручную"
        isOpen={isManualSessionModalOpen}
        onClose={() => setIsManualSessionModalOpen(false)}
        onSubmit={saveManualSession}
        submitText="Добавить минуты"
      >
        <p className="pomodoro-hint">Запись попадёт в итоги выбранного дня и автоматически увеличит связанные цели.</p>
        <FormInput label="Занятие" value={manualTitle} onChange={setManualTitle} placeholder="Например, чтение" list="activity-title-options" />
        <FormInput label="Сколько минут" value={manualMinutes} onChange={setManualMinutes} type="number" placeholder="30" />
        <AdvancedColorPicker label="Цвет занятия" value={manualColor} onChange={setManualColor} />
      </FormModal>

      <datalist id="activity-title-options">
        {activityTitles.map((title) => <option key={title} value={title} />)}
      </datalist>
    </>
  );
}
