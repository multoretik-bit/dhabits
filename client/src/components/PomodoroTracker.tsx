import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { CheckCircle2, ChevronDown, Clock3, Coins, Pause, Pencil, Play, Plus, RotateCcw, Square, Target, TimerReset, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
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
    activityMicroGoals,
    addActivityMicroGoal,
    updateActivityMicroGoal,
    deleteActivityMicroGoal,
    activityTimer,
    saveActivityTimer,
    addActivitySession,
    deleteActivitySession,
  } = useApp();
  const [now, setNow] = useState(Date.now());
  const [isMicroGoalModalOpen, setIsMicroGoalModalOpen] = useState(false);
  const [editingMicroGoalId, setEditingMicroGoalId] = useState<string | null>(null);
  const [microGoalTitle, setMicroGoalTitle] = useState("");
  const [microGoalMinutes, setMicroGoalMinutes] = useState("30");
  const [microGoalReward, setMicroGoalReward] = useState("0,1");
  const [microGoalColor, setMicroGoalColor] = useState("#315cff");
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
  const microGoalProgress = useMemo(() => activityMicroGoals.map((goal) => {
    const normalizedTitle = goal.title.trim().toLocaleLowerCase("ru-RU");
    const completedSeconds = dailySessions
      .filter((session) => session.title.trim().toLocaleLowerCase("ru-RU") === normalizedTitle)
      .reduce((sum, session) => sum + session.durationSeconds, 0);
    const targetSeconds = Math.max(60, goal.targetMinutes * 60);
    return {
      ...goal,
      completedSeconds,
      completedMinutes: Math.round(completedSeconds / 6) / 10,
      earnedCoins: dailySessions
        .filter((session) => session.title.trim().toLocaleLowerCase("ru-RU") === normalizedTitle)
        .reduce((sum, session) => sum + Math.max(0, session.earnedCoins || 0), 0),
      progress: Math.min(100, (completedSeconds / targetSeconds) * 100),
    };
  }), [activityMicroGoals, dailySessions]);
  const activityTitles = useMemo(() => {
    const titles = new Map<string, string>();
    activityMicroGoals.forEach((goal) => titles.set(goal.title.trim().toLocaleLowerCase("ru-RU"), goal.title.trim()));
    activitySessions.forEach((session) => {
      const title = session.title.trim();
      if (title) titles.set(title.toLocaleLowerCase("ru-RU"), title);
    });
    return Array.from(titles.values()).sort((a, b) => a.localeCompare(b, "ru-RU"));
  }, [activityMicroGoals, activitySessions]);

  const startTimer = () => {
    if (activityTimer.isRunning) return;
    setNow(Date.now());
    saveActivityTimer({ ...activityTimer, isRunning: true, startedAt: new Date().toISOString() });
  };

  const saveMicroGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const title = microGoalTitle.trim();
    const minutes = Math.max(1, Math.round(Number(microGoalMinutes)));
    const rewardPerMinute = Math.max(0, Math.round(Number(microGoalReward.replace(",", ".")) * 1000) / 1000);
    if (!title || !Number.isFinite(minutes) || !Number.isFinite(rewardPerMinute)) return;
    if (activityMicroGoals.some((goal) => goal.id !== editingMicroGoalId && goal.title.trim().toLocaleLowerCase("ru-RU") === title.toLocaleLowerCase("ru-RU"))) {
      toast.error("Микроцель с таким названием уже есть");
      return;
    }
    if (editingMicroGoalId) {
      updateActivityMicroGoal(editingMicroGoalId, { title, targetMinutes: minutes, rewardPerMinute, color: microGoalColor });
    } else {
      addActivityMicroGoal({
        id: nanoid(),
        title,
        targetMinutes: minutes,
        rewardPerMinute,
        color: microGoalColor,
        createdAt: new Date().toISOString(),
      });
    }
    setMicroGoalTitle("");
    setMicroGoalMinutes("30");
    setMicroGoalReward("0,1");
    setEditingMicroGoalId(null);
    setIsMicroGoalModalOpen(false);
    toast.success(editingMicroGoalId ? "Микроцель обновлена" : "Ежедневная микроцель добавлена");
  };

  const openNewMicroGoal = () => {
    setEditingMicroGoalId(null);
    setMicroGoalTitle("");
    setMicroGoalMinutes("30");
    setMicroGoalReward("0,1");
    setMicroGoalColor("#315cff");
    setIsMicroGoalModalOpen(true);
  };

  const openMicroGoalEditor = (goal: typeof activityMicroGoals[number]) => {
    setEditingMicroGoalId(goal.id);
    setMicroGoalTitle(goal.title);
    setMicroGoalMinutes(String(goal.targetMinutes));
    setMicroGoalReward(String(goal.rewardPerMinute || 0).replace(".", ","));
    setMicroGoalColor(goal.color);
    setIsMicroGoalModalOpen(true);
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
        <p className="pomodoro-hint">Запустите таймер, а после завершения укажите, чем занимались. Время автоматически попадёт в одноимённую микроцель.</p>

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

        <div className="micro-goals-section">
          <div className="micro-goals-head">
            <div><Target className="size-4" /><div><strong>Ежедневные микроцели</strong><span>Обнуляются каждый новый день</span></div></div>
            <button type="button" className="app-button is-secondary" onClick={openNewMicroGoal}><Plus className="size-4" /> Микроцель</button>
          </div>
          {microGoalProgress.length ? (
            <div className="micro-goals-grid">
              {microGoalProgress.map((goal) => {
                const isComplete = goal.progress >= 100;
                return (
                  <article key={goal.id} className={`micro-goal-card ${isComplete ? "is-complete" : ""}`} style={{ "--micro-goal-color": goal.color } as CSSProperties}>
                    <div className="micro-goal-top">
                      <i>{isComplete ? <CheckCircle2 className="size-4" /> : <Target className="size-4" />}</i>
                      <div><strong>{goal.title}</strong><span>{isComplete ? "Готово на сегодня" : `${goal.completedMinutes} из ${goal.targetMinutes} мин`}</span></div>
                      <b>{Math.round(goal.progress)}%</b>
                      <button type="button" className="icon-button is-small" onClick={() => openMicroGoalEditor(goal)} aria-label={`Изменить микроцель ${goal.title}`}><Pencil className="size-3.5" /></button>
                      <button type="button" className="icon-button is-small subtle-danger" onClick={() => deleteActivityMicroGoal(goal.id)} aria-label={`Удалить микроцель ${goal.title}`}><Trash2 className="size-3.5" /></button>
                    </div>
                    <div className="micro-goal-reward"><Coins className="size-3.5" /><span>{(goal.rewardPerMinute || 0).toLocaleString("ru-RU")} мон. за минуту</span><b>+{goal.earnedCoins.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} сегодня</b></div>
                    <div className="micro-goal-progress" role="progressbar" aria-label={`Прогресс микроцели ${goal.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goal.progress)}><i style={{ width: `${goal.progress}%` }} /></div>
                  </article>
                );
              })}
            </div>
          ) : (
            <button type="button" className="micro-goals-empty" onClick={openNewMicroGoal}><Plus className="size-5" /><div><strong>Добавьте первую микроцель</strong><span>Например: 30 минут чтения каждый день</span></div></button>
          )}
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
        title={editingMicroGoalId ? "Изменить микроцель" : "Новая ежедневная микроцель"}
        isOpen={isMicroGoalModalOpen}
        onClose={() => { setIsMicroGoalModalOpen(false); setEditingMicroGoalId(null); }}
        onSubmit={saveMicroGoal}
        submitText={editingMicroGoalId ? "Сохранить изменения" : "Добавить микроцель"}
      >
        <p className="pomodoro-hint">Цель повторяется каждый день. Минуты занятия заполняют прогресс и автоматически приносят заданное количество монет.</p>
        <FormInput label="Название" value={microGoalTitle} onChange={setMicroGoalTitle} placeholder="Например, Чтение" />
        <FormInput label="Минут в день" value={microGoalMinutes} onChange={setMicroGoalMinutes} type="number" placeholder="30" />
        <FormInput label="Монет за 1 минуту" value={microGoalReward} onChange={setMicroGoalReward} placeholder="Например, 0,1" />
        <AdvancedColorPicker label="Цвет микроцели" value={microGoalColor} onChange={setMicroGoalColor} />
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
        <p className="pomodoro-hint">Чтобы время попало в микроцель, выберите или напишите её название без изменений.</p>
        {activityMicroGoals.length > 0 && (
          <div className="micro-goal-session-choices">
            <span>Добавить время в микроцель</span>
            <div>{activityMicroGoals.map((goal) => <button key={goal.id} type="button" style={{ "--micro-goal-color": goal.color } as CSSProperties} onClick={() => { setSessionTitle(goal.title); setSessionColor(goal.color); }}>{goal.title}</button>)}</div>
          </div>
        )}
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
