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
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetTitle, setTargetTitle] = useState(activityTimer.targetTitle || "");
  const [targetMinutes, setTargetMinutes] = useState(String(activityTimer.targetMinutes || 30));
  const [targetColor, setTargetColor] = useState(activityTimer.targetColor || "#315cff");
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
  const targetSeconds = Math.max(1, (activityTimer.targetMinutes || 0) * 60);
  const progress = activityTimer.targetMinutes ? Math.min(100, (elapsedSeconds / targetSeconds) * 100) : 0;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  const selectedDateString = formatDateToDateString(selectedDate);
  const dailySessions = useMemo(
    () => activitySessions
      .filter((session) => session.date === selectedDateString)
      .sort((a, b) => b.endedAt.localeCompare(a.endedAt)),
    [activitySessions, selectedDateString]
  );

  const groupedTotals = useMemo(() => {
    const totals = new Map<string, { key: string; title: string; color: string; seconds: number; sessions: ActivitySession[] }>();
    dailySessions.forEach((session) => {
      const key = `${session.color}:${session.title.trim().toLocaleLowerCase("ru-RU")}`;
      const current = totals.get(key);
      if (current) {
        current.seconds += session.durationSeconds;
        current.sessions.push(session);
      } else {
        totals.set(key, { key, title: session.title, color: session.color, seconds: session.durationSeconds, sessions: [session] });
      }
    });
    return Array.from(totals.values()).sort((a, b) => b.seconds - a.seconds);
  }, [dailySessions]);

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
    if (!activityTimer.targetMinutes || !activityTimer.targetTitle) {
      setIsTargetModalOpen(true);
      return;
    }
    setNow(Date.now());
    saveActivityTimer({ ...activityTimer, isRunning: true, startedAt: new Date().toISOString() });
  };

  const saveTarget = (event: React.FormEvent) => {
    event.preventDefault();
    const title = targetTitle.trim();
    const minutes = Math.max(1, Math.round(Number(targetMinutes)));
    if (!title || !Number.isFinite(minutes)) return;
    saveActivityTimer({
      ...activityTimer,
      targetTitle: title,
      targetMinutes: minutes,
      targetColor,
    });
    setTargetMinutes(String(minutes));
    setSessionTitle(title);
    setSessionColor(targetColor);
    setIsTargetModalOpen(false);
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
    setSessionTitle(activityTimer.targetTitle || "");
    setSessionColor(activityTimer.targetColor || "#315cff");
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
        <SectionHeading icon={TimerReset} title="Таймер занятий" meta={activityTimer.isRunning ? "Идёт" : hasActiveTime ? "Пауза" : "Готов"} action={<button type="button" className="icon-button" onClick={() => { setTargetTitle(activityTimer.targetTitle || ""); setTargetMinutes(String(activityTimer.targetMinutes || 30)); setTargetColor(activityTimer.targetColor || "#315cff"); setIsTargetModalOpen(true); }} aria-label="Выбрать занятие и минуты"><Plus className="size-4" /></button>} />
        <p className="pomodoro-hint">Нажмите плюс, выберите действие и сколько минут хотите им заниматься. Шкала заполнится по мере выполнения.</p>

        <div className={`pomodoro-clock ${activityTimer.isRunning ? "is-running" : ""}`} style={{ ...timerStyle, "--primary": activityTimer.targetColor || "#315cff" } as CSSProperties} aria-label={`Выполнено ${Math.round(progress)}%`}>
          <div>
            <span>{activityTimer.targetTitle || (activityTimer.isRunning ? "В фокусе" : hasActiveTime ? "На паузе" : "Выберите занятие")}</span>
            <strong>{formatClock(elapsedSeconds)}</strong>
            <small>{activityTimer.targetMinutes ? (remainingSeconds > 0 ? `осталось ${formatDuration(remainingSeconds)} из ${activityTimer.targetMinutes} мин` : `цель ${activityTimer.targetMinutes} мин выполнена`) : "нажмите +, чтобы задать цель"}</small>
          </div>
        </div>

        <div className="activity-target-progress" style={{ "--activity-color": activityTimer.targetColor || "#315cff" } as CSSProperties}>
          <div><span>Прогресс занятия</span><strong>{Math.round(progress)}%</strong></div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><i style={{ width: `${progress}%` }} /></div>
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
                        <b>{formatDuration(session.durationSeconds)}</b>
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
        title="Новое занятие"
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        onSubmit={saveTarget}
        submitText="Выбрать занятие"
      >
        <FormInput label="Что будете делать" value={targetTitle} onChange={setTargetTitle} placeholder="Например, читать или учить английский" list="activity-title-options" />
        <FormInput label="Сколько минут" value={targetMinutes} onChange={setTargetMinutes} type="number" placeholder="30" />
        <AdvancedColorPicker label="Цвет шкалы" value={targetColor} onChange={setTargetColor} />
      </FormModal>

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
        <FormInput label="Чем занимались" value={sessionTitle} onChange={setSessionTitle} placeholder="Например, чтение или английский" list="activity-title-options" />
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
