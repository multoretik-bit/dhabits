import { useMemo, useState, type CSSProperties } from "react";
import { BatteryCharging, Clock3, Plus, Sparkles } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, type DailyEnergyRecord } from "@/contexts/AppContext";
import { formatDateToDateString } from "@/lib/dateUtils";
import { SectionHeading } from "@/components/AppUI";
import DmoneyCapitalCard from "@/components/DmoneyCapitalCard";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";

function formatUsefulTime(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!minutes) return "0 мин";
  if (!hours) return `${minutes} мин`;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

export default function ProfileDailyDashboard() {
  const { characterState, updateCharacterState, activitySessions } = useApp();
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateToDateString(today);
  const energyRecord = characterState.dailyEnergy?.[dateKey];
  const energySpentToday = energyRecord ? Math.max(0, energyRecord.initial - energyRecord.current) : 0;
  const usefulSeconds = activitySessions
    .filter(session => session.date === dateKey)
    .reduce((sum, session) => sum + session.durationSeconds, 0);

  const [isEnergyOpen, setIsEnergyOpen] = useState(false);
  const [energyValue, setEnergyValue] = useState(String(energyRecord?.initial ?? characterState.attributes?.energy ?? 100));
  const [energySpent, setEnergySpent] = useState(String(energySpentToday));

  const saveEnergy = (event: React.FormEvent) => {
    event.preventDefault();
    const numericValue = Number(energyValue);
    const numericSpent = Number(energySpent);
    if (!Number.isFinite(numericValue) || !Number.isFinite(numericSpent)) {
      toast.error("Введите энергию и расход от 0 до 100%");
      return;
    }
    const dailyValue = Math.min(100, Math.max(0, Math.round(numericValue)));
    const spentValue = Math.min(dailyValue, Math.max(0, Math.round(numericSpent)));
    const currentValue = dailyValue - spentValue;
    const nowIso = new Date().toISOString();
    const nextRecord: DailyEnergyRecord = {
      date: dateKey,
      initial: dailyValue,
      current: currentValue,
      changes: spentValue > 0 ? [{ id: nanoid(), delta: -spentValue, note: "Потрачено за день", createdAt: nowIso }] : [],
      updatedAt: nowIso,
    };
    updateCharacterState({
      dailyEnergy: { ...(characterState.dailyEnergy || {}), [dateKey]: nextRecord },
      attributes: { ...(characterState.attributes || {}), energy: currentValue },
    });
    setEnergyValue(String(dailyValue));
    setEnergySpent(String(spentValue));
    setIsEnergyOpen(false);
    toast.success(`Осталось энергии: ${currentValue}%`);
  };

  return (
    <>
      <section className="profile-daily app-surface">
        <SectionHeading icon={Sparkles} title="Сегодня" meta={today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} />

        <div className="profile-metrics-grid">
          <DmoneyCapitalCard />

          <article className="profile-metric-card is-useful" style={{ "--metric-color": "#19b37a" } as CSSProperties}>
            <div className="profile-metric-top"><span className="profile-metric-icon"><Clock3 className="size-5" /></span><div><span>Время с пользой</span><small>Из таймера в профиле</small></div></div>
            <div className="profile-metric-value"><strong>{formatUsefulTime(usefulSeconds)}</strong><span>{activitySessions.filter(session => session.date === dateKey).length} завершённых сессий</span></div>
          </article>

          <button type="button" className="profile-metric-card is-energy" style={{ "--metric-color": "#ff9f1c" } as CSSProperties} onClick={() => { setEnergyValue(String(energyRecord?.initial ?? characterState.attributes?.energy ?? 100)); setEnergySpent(String(energySpentToday)); setIsEnergyOpen(true); }}>
            <div className="profile-metric-top"><span className="profile-metric-icon"><BatteryCharging className="size-5" /></span><div><span>Энергия</span><small>Выбрать запас и расход</small></div><Plus className="size-4 metric-add-icon" /></div>
            <div className="profile-metric-value"><strong>{energyRecord ? `${energyRecord.current}%` : "—"}</strong><span>{energyRecord ? `Потрачено ${energySpentToday}% из ${energyRecord.initial}%` : "Сколько энергии у вас сегодня?"}</span></div>
          </button>

        </div>

      </section>

      <FormModal title="Энергия на сегодня" isOpen={isEnergyOpen} onClose={() => setIsEnergyOpen(false)} onSubmit={saveEnergy} submitText="Сохранить энергию">
        <div className="profile-energy-form-row">
          <FormInput label="Энергия на день, %" value={energyValue} onChange={setEnergyValue} type="number" placeholder="Например, 80" />
          <FormInput label="Потрачено за день, %" value={energySpent} onChange={setEnergySpent} type="number" placeholder="Например, 25" />
        </div>
        <div className="profile-energy-preview">
          <BatteryCharging className="size-5" />
          <div><span>Останется энергии</span><strong>{Math.max(0, Math.min(100, Math.round(Number(energyValue) || 0)) - Math.max(0, Math.round(Number(energySpent) || 0)))}%</strong></div>
        </div>
        <p className="profile-form-hint">Можно открыть карточку снова и исправить как дневной запас, так и потраченную энергию.</p>
      </FormModal>

    </>
  );
}
