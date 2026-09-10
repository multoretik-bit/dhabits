import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Gauge, Pencil, Plus, Trash2, Utensils, X } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, type DailyFoodEntry, type DailyWellnessRecord } from "@/contexts/AppContext";
import { formatDateToDateString, isSameDay } from "@/lib/dateUtils";
import { getExceededNutritionTargets, getNutritionTotals, NUTRITION_TARGETS, type NutritionValues } from "@/lib/nutrition";

const METRICS: Array<{ key: keyof NutritionValues; label: string; shortLabel: string; unit: string }> = [
  { key: "calories", label: "Калории", shortLabel: "Ккал", unit: "ккал" },
  { key: "protein", label: "Белки", shortLabel: "Б", unit: "г" },
  { key: "fat", label: "Жиры", shortLabel: "Ж", unit: "г" },
  { key: "carbs", label: "Углеводы", shortLabel: "У", unit: "г" },
];

function parseAmount(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 10) / 10) : 0;
}

function formatAmount(value: number) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
}

function getMonthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const days = new Date(year, monthIndex + 1, 0).getDate();
  return [...Array.from({ length: leading }, () => null), ...Array.from({ length: days }, (_, index) => new Date(year, monthIndex, index + 1))];
}

export default function HealthCaloriesTracker() {
  const { characterState, updateCharacterState } = useApp();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [shownMonth, setShownMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  const records = characterState.dailyWellness || {};
  const selectedDateString = formatDateToDateString(selectedDate);
  const selectedRecord = records[selectedDateString];
  const foods = selectedRecord?.foods || [];
  const totals = useMemo(() => getNutritionTotals(foods), [foods]);
  const monthCells = useMemo(() => getMonthCells(shownMonth), [shownMonth]);

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setTitle("");
    setCalories("");
    setProtein("");
    setFat("");
    setCarbs("");
  };

  const saveFoods = (nextFoods: DailyFoodEntry[]) => {
    const nextRecord: DailyWellnessRecord = {
      ...(selectedRecord || { date: selectedDateString }),
      date: selectedDateString,
      foods: nextFoods,
      updatedAt: new Date().toISOString(),
    };
    updateCharacterState({ dailyWellness: { ...records, [selectedDateString]: nextRecord } });
  };

  const openNewEntry = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditor = (entry: DailyFoodEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setCalories(String(entry.calories || ""));
    setProtein(String(entry.protein || ""));
    setFat(String(entry.fat || ""));
    setCarbs(String(entry.carbs || ""));
    setIsFormOpen(true);
  };

  const saveEntry = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const values = {
      calories: parseAmount(calories),
      protein: parseAmount(protein),
      fat: parseAmount(fat),
      carbs: parseAmount(carbs),
    };
    if (!trimmedTitle || !Object.values(values).some((value) => value > 0)) return;
    const previousEntry = foods.find((entry) => entry.id === editingId);
    const entry: DailyFoodEntry = {
      id: editingId || nanoid(),
      title: trimmedTitle,
      ...values,
      createdAt: previousEntry?.createdAt || new Date().toISOString(),
    };
    const nextFoods = editingId ? foods.map((item) => item.id === editingId ? entry : item) : [...foods, entry];
    const exceeded = getExceededNutritionTargets(getNutritionTotals(nextFoods));
    saveFoods(nextFoods);
    resetForm();
    if (exceeded.length) {
      const labels: Record<keyof NutritionValues, string> = { calories: "калории", protein: "белки", fat: "жиры", carbs: "углеводы" };
      toast.warning(`${editingId ? "Запись обновлена" : "Еда добавлена"}. Превышение: ${exceeded.map((item) => `${labels[item.key]} на ${formatAmount(item.exceededBy)}`).join(", ")}`);
    } else {
      toast.success(editingId ? "Запись обновлена" : "Еда добавлена в дневник");
    }
  };

  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date);
    resetForm();
  };

  const changeMonth = (offset: number) => {
    setShownMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <section className="nutrition-tool" aria-label="Календарь калорий">
      <div className="nutrition-calendar">
        <div className="nutrition-calendar-head">
          <div><span><CalendarDays className="size-5" /></span><div><strong>{shownMonth.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</strong><small>Выберите день питания</small></div></div>
          <div><button type="button" onClick={() => changeMonth(-1)} aria-label="Предыдущий месяц"><ChevronLeft className="size-4" /></button><button type="button" onClick={() => changeMonth(1)} aria-label="Следующий месяц"><ChevronRight className="size-4" /></button></div>
        </div>
        <div className="nutrition-weekdays">{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="nutrition-month-grid">
          {monthCells.map((date, index) => {
            if (!date) return <span key={`empty-${index}`} />;
            const dateString = formatDateToDateString(date);
            const dayFoods = records[dateString]?.foods || [];
            const dayCalories = getNutritionTotals(dayFoods).calories;
            return (
              <button key={dateString} type="button" className={`${isSameDay(date, selectedDate) ? "is-selected" : ""} ${isSameDay(date, today) ? "is-today" : ""} ${dayFoods.length ? "has-food" : ""}`} onClick={() => selectCalendarDate(date)} aria-pressed={isSameDay(date, selectedDate)} title={dayFoods.length ? `${formatAmount(dayCalories)} ккал` : "Нет записей"}>
                <strong>{date.getDate()}</strong>{dayFoods.length > 0 && <small>{formatAmount(dayCalories)}</small>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="nutrition-day">
        <div className="nutrition-day-head">
          <div><span>Питание за день</span><strong>{selectedDate.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</strong></div>
          <button type="button" className="app-button" onClick={openNewEntry}><Plus className="size-4" /> Добавить еду</button>
        </div>

        <div className="nutrition-metrics">
          {METRICS.map((metric) => {
            const current = totals[metric.key];
            const target = NUTRITION_TARGETS[metric.key];
            const exceededBy = Math.max(0, current - target);
            const percent = Math.min(100, (current / target) * 100);
            return (
              <article
                key={metric.key}
                className={metric.key === "calories" ? "nutrition-calories-main" : "nutrition-macro-card"}
                style={{ "--nutrition-progress": `${percent}%` } as React.CSSProperties}
              >
                <div><span>{metric.label}</span><strong>{formatAmount(current)} <small>/ {target} {metric.unit}</small></strong></div>
                <i><span /></i>
                <small className={exceededBy > 0 ? "is-exceeded" : undefined}>
                  {exceededBy > 0
                    ? `Превышение на ${formatAmount(exceededBy)} ${metric.unit}`
                    : `Осталось ${formatAmount(target - current)} ${metric.unit}`}
                </small>
              </article>
            );
          })}
        </div>

        <div className="nutrition-limit-note"><Gauge className="size-4" /><span>Нормы служат ориентиром: при превышении еда сохранится, а разница будет отмечена выше.</span></div>

        {isFormOpen && (
          <form className="nutrition-entry-form" onSubmit={saveEntry}>
            <div className="nutrition-entry-form-head"><strong>{editingId ? "Изменить запись" : "Что вы съели?"}</strong><button type="button" onClick={resetForm} aria-label="Закрыть форму"><X className="size-4" /></button></div>
            <label className="is-wide"><span>Название еды</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, рис с курицей" /></label>
            {METRICS.map((metric) => {
              const values = { calories, protein, fat, carbs };
              const setters = { setCalories, setProtein, setFat, setCarbs };
              const setter = setters[`set${metric.key.charAt(0).toUpperCase()}${metric.key.slice(1)}` as keyof typeof setters];
              return <label key={metric.key}><span>{metric.label}, {metric.unit}</span><input type="number" min="0" step="0.1" inputMode="decimal" value={values[metric.key]} onChange={(event) => setter(event.target.value)} placeholder="0" /></label>;
            })}
            <button type="submit" className="app-button is-wide" disabled={!title.trim() || ![calories, protein, fat, carbs].some((value) => parseAmount(value) > 0)}>{editingId ? "Сохранить изменения" : "Добавить в дневник"}</button>
          </form>
        )}

        <div className="nutrition-food-list">
          {foods.map((entry) => (
            <article key={entry.id}>
              <span className="nutrition-food-icon"><Utensils className="size-4" /></span>
              <div><strong>{entry.title}</strong><span>{formatAmount(entry.calories || 0)} ккал · Б {formatAmount(entry.protein || 0)} · Ж {formatAmount(entry.fat || 0)} · У {formatAmount(entry.carbs || 0)}</span></div>
              <button type="button" onClick={() => openEditor(entry)} aria-label={`Изменить ${entry.title}`}><Pencil className="size-4" /></button>
              <button type="button" className="is-danger" onClick={() => saveFoods(foods.filter((item) => item.id !== entry.id))} aria-label={`Удалить ${entry.title}`}><Trash2 className="size-4" /></button>
            </article>
          ))}
          {!foods.length && !isFormOpen && <button type="button" className="nutrition-empty" onClick={openNewEntry}><Plus className="size-5" /><span><strong>Добавьте первую еду</strong><small>Запишите калории и БЖУ за выбранный день</small></span></button>}
        </div>
      </div>
    </section>
  );
}
