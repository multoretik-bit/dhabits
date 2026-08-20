import { useMemo, useState, type CSSProperties } from "react";
import { BatteryCharging, Clock3, Flame, MoonStar, Plus, Sparkles, Utensils } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, type DailyEnergyRecord, type DailyFoodEntry, type DailyWellnessRecord } from "@/contexts/AppContext";
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
  const wellnessByDate = characterState.dailyWellness && typeof characterState.dailyWellness === "object"
    ? characterState.dailyWellness
    : {};
  const record: DailyWellnessRecord = wellnessByDate[dateKey] || {
    date: dateKey,
    foods: [],
    updatedAt: new Date().toISOString(),
  };
  const foods = Array.isArray(record.foods) ? record.foods : [];
  const energyRecord = characterState.dailyEnergy?.[dateKey];
  const energySpentToday = energyRecord ? Math.max(0, energyRecord.initial - energyRecord.current) : 0;
  const usefulSeconds = activitySessions
    .filter(session => session.date === dateKey)
    .reduce((sum, session) => sum + session.durationSeconds, 0);
  const calories = foods.reduce((sum, food) => sum + Number(food.calories || 0), 0);

  const [isSleepOpen, setIsSleepOpen] = useState(false);
  const [isFoodOpen, setIsFoodOpen] = useState(false);
  const [isEnergyOpen, setIsEnergyOpen] = useState(false);
  const [sleepHours, setSleepHours] = useState(String(record.sleepHours ?? 8));
  const [energyValue, setEnergyValue] = useState(String(energyRecord?.initial ?? characterState.attributes?.energy ?? 100));
  const [energySpent, setEnergySpent] = useState(String(energySpentToday));
  const [foodTitle, setFoodTitle] = useState("");
  const [foodGrams, setFoodGrams] = useState("100");
  const [foodCalories, setFoodCalories] = useState("");

  const saveWellness = (nextRecord: DailyWellnessRecord) => {
    updateCharacterState({ dailyWellness: { ...wellnessByDate, [dateKey]: nextRecord } });
  };

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

  const saveSleep = (event: React.FormEvent) => {
    event.preventDefault();
    const hours = Math.min(24, Math.max(0, Number(sleepHours)));
    if (!Number.isFinite(hours)) return;
    saveWellness({ ...record, sleepHours: Math.round(hours * 4) / 4, foods, updatedAt: new Date().toISOString() });
    setIsSleepOpen(false);
    toast.success("Сон за сегодня сохранён");
  };

  const addFood = (event: React.FormEvent) => {
    event.preventDefault();
    const grams = Math.max(1, Number(foodGrams));
    const per100 = Math.max(0, Number(foodCalories));
    if (!foodTitle.trim() || !Number.isFinite(grams) || !Number.isFinite(per100)) return;
    const entry: DailyFoodEntry = {
      id: nanoid(),
      title: foodTitle.trim(),
      grams: Math.round(grams),
      caloriesPer100g: Math.round(per100),
      calories: Math.round((grams * per100) / 100),
      createdAt: new Date().toISOString(),
    };
    saveWellness({ ...record, foods: [...foods, entry], updatedAt: new Date().toISOString() });
    setFoodTitle("");
    setFoodCalories("");
    setIsFoodOpen(false);
    toast.success("Еда добавлена в дневник");
  };

  return (
    <>
      <section className="profile-daily app-surface">
        <SectionHeading icon={Sparkles} title="Сегодня" meta={today.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} />

        <div className="profile-metrics-grid">
          <DmoneyCapitalCard />

          <button type="button" className="profile-metric-card is-energy" style={{ "--metric-color": "#ff9f1c" } as CSSProperties} onClick={() => { setEnergyValue(String(energyRecord?.initial ?? characterState.attributes?.energy ?? 100)); setEnergySpent(String(energySpentToday)); setIsEnergyOpen(true); }}>
            <div className="profile-metric-top"><span className="profile-metric-icon"><BatteryCharging className="size-5" /></span><div><span>Энергия</span><small>Выбрать запас и расход</small></div><Plus className="size-4 metric-add-icon" /></div>
            <div className="profile-metric-value"><strong>{energyRecord ? `${energyRecord.current}%` : "—"}</strong><span>{energyRecord ? `Потрачено ${energySpentToday}% из ${energyRecord.initial}%` : "Сколько энергии у вас сегодня?"}</span></div>
          </button>

          <button type="button" className="profile-metric-card is-sleep" style={{ "--metric-color": "#7765f5" } as CSSProperties} onClick={() => { setSleepHours(String(record.sleepHours ?? 8)); setIsSleepOpen(true); }}>
            <div className="profile-metric-top"><span className="profile-metric-icon"><MoonStar className="size-5" /></span><div><span>Сон</span><small>Нажмите, чтобы изменить</small></div></div>
            <div className="profile-metric-value"><strong>{record.sleepHours !== undefined ? `${record.sleepHours} ч` : "—"}</strong><span>{record.sleepHours !== undefined ? "Записано за сегодня" : "Сколько вы спали?"}</span></div>
          </button>

          <button type="button" className="profile-metric-card is-food" style={{ "--metric-color": "#f04e7a" } as CSSProperties} onClick={() => setIsFoodOpen(true)}>
            <div className="profile-metric-top"><span className="profile-metric-icon"><Utensils className="size-5" /></span><div><span>Питание</span><small>{foods.length} приёмов пищи</small></div><Plus className="size-4 metric-add-icon" /></div>
            <div className="profile-metric-value"><strong>{calories.toLocaleString("ru-RU")} <small>ккал</small></strong><span>Съедено сегодня</span></div>
          </button>

          <article className="profile-metric-card is-useful" style={{ "--metric-color": "#19b37a" } as CSSProperties}>
            <div className="profile-metric-top"><span className="profile-metric-icon"><Clock3 className="size-5" /></span><div><span>С пользой</span><small>Из таймера в профиле</small></div></div>
            <div className="profile-metric-value"><strong>{formatUsefulTime(usefulSeconds)}</strong><span>{activitySessions.filter(session => session.date === dateKey).length} завершённых сессий</span></div>
          </article>
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

      <FormModal title="Сон сегодня" isOpen={isSleepOpen} onClose={() => setIsSleepOpen(false)} onSubmit={saveSleep} submitText="Сохранить сон">
        <FormInput label="Сколько часов спали" value={sleepHours} onChange={setSleepHours} type="number" placeholder="Например, 7.5" />
        <p className="profile-form-hint">Можно указать дробное значение: 7.5 — это 7 часов 30 минут.</p>
      </FormModal>

      <FormModal title="Добавить еду" isOpen={isFoodOpen} onClose={() => setIsFoodOpen(false)} onSubmit={addFood} submitText="Добавить в дневник">
        <FormInput label="Что вы съели" value={foodTitle} onChange={setFoodTitle} placeholder="Например, овсянка с бананом" />
        <div className="profile-food-form-row">
          <FormInput label="Вес, грамм" value={foodGrams} onChange={setFoodGrams} type="number" />
          <FormInput label="Ккал на 100 г" value={foodCalories} onChange={setFoodCalories} type="number" />
        </div>
        <div className="profile-calorie-preview"><Flame className="size-5" /><div><span>Получится</span><strong>{Math.round((Math.max(0, Number(foodGrams) || 0) * Math.max(0, Number(foodCalories) || 0)) / 100)} ккал</strong></div></div>
      </FormModal>
    </>
  );
}
