import { useMemo, useState } from "react";
import { BatteryCharging, Minus, Plus, Sunrise } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, type DailyEnergyRecord } from "@/contexts/AppContext";
import { formatDateToDateString } from "@/lib/dateUtils";

const ENERGY_COLOR = "#ff9f1c";

function clampEnergy(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatSigned(value: number) {
  return `${value > 0 ? "+" : ""}${value}%`;
}

export default function DailyEnergyCard() {
  const { characterState, updateCharacterState } = useApp();
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateToDateString(today);
  const dailyEnergy = characterState.dailyEnergy && typeof characterState.dailyEnergy === "object"
    ? characterState.dailyEnergy
    : {};
  const record = dailyEnergy[dateKey];
  const attributes = characterState.attributes && typeof characterState.attributes === "object"
    ? characterState.attributes
    : {};
  const fallbackEnergy = clampEnergy(Number(attributes.energy ?? 100));

  const [morningValue, setMorningValue] = useState(String(fallbackEnergy));
  const [changeAmount, setChangeAmount] = useState("10");
  const [changeNote, setChangeNote] = useState("");

  const saveRecord = (nextRecord: DailyEnergyRecord) => {
    updateCharacterState({
      dailyEnergy: { ...dailyEnergy, [dateKey]: nextRecord },
      attributes: { ...attributes, energy: nextRecord.current },
    });
  };

  const setMorningEnergy = () => {
    const value = clampEnergy(Number(morningValue));
    if (!Number.isFinite(Number(morningValue))) {
      toast.error("Введите энергию от 0 до 100%");
      return;
    }

    saveRecord({
      date: dateKey,
      initial: value,
      current: value,
      changes: [],
      updatedAt: new Date().toISOString(),
    });
    setMorningValue(String(value));
    toast.success(`Энергия на утро: ${value}%`);
  };

  const changeEnergy = (direction: -1 | 1) => {
    if (!record) return;
    const rawAmount = Number(changeAmount);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      toast.error("Укажите количество энергии");
      return;
    }

    const requestedDelta = direction * Math.min(100, Math.round(rawAmount));
    const nextValue = clampEnergy(record.current + requestedDelta);
    const actualDelta = nextValue - record.current;
    if (actualDelta === 0) {
      toast.info(direction > 0 ? "Энергия уже на максимуме" : "Энергия уже закончилась");
      return;
    }

    saveRecord({
      ...record,
      current: nextValue,
      updatedAt: new Date().toISOString(),
      changes: [
        ...(Array.isArray(record.changes) ? record.changes : []),
        {
          id: nanoid(),
          delta: actualDelta,
          note: changeNote.trim() || undefined,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setChangeNote("");
  };

  if (!record) {
    return (
      <article className="daily-energy-card is-empty" style={{ "--energy-color": ENERGY_COLOR } as React.CSSProperties}>
        <div className="daily-energy-intro">
          <div className="daily-energy-icon"><Sunrise className="size-6" /></div>
          <div>
            <span>Начало дня</span>
            <h3>Сколько энергии у вас сегодня?</h3>
            <p>Укажите утренний запас от 0 до 100%. В течение дня его можно будет уменьшать и пополнять.</p>
          </div>
        </div>
        <div className="daily-energy-morning-form">
          <label>
            <span>Энергия утром</span>
            <div><input type="number" min="0" max="100" inputMode="numeric" value={morningValue} onChange={event => setMorningValue(event.target.value)} /><b>%</b></div>
          </label>
          <button type="button" className="app-button" onClick={setMorningEnergy}><BatteryCharging className="size-4" /> Начать день</button>
        </div>
      </article>
    );
  }

  const dayDelta = record.current - record.initial;
  const changes = Array.isArray(record.changes) ? [...record.changes].reverse() : [];

  return (
    <article className="daily-energy-card" style={{ "--energy-color": ENERGY_COLOR } as React.CSSProperties}>
      <div className="daily-energy-overview">
        <div className="daily-energy-icon"><BatteryCharging className="size-6" /></div>
        <div className="daily-energy-title">
          <span>Энергия сегодня</span>
          <h3>{today.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</h3>
        </div>
        <strong className="daily-energy-value">{record.current}%</strong>
      </div>

      <div className="daily-energy-progress" aria-label={`Осталось энергии ${record.current}%`}>
        <i style={{ width: `${record.current}%` }} />
      </div>

      <div className="daily-energy-stats">
        <div><span>Было утром</span><strong>{record.initial}%</strong></div>
        <div><span>Изменение за день</span><strong className={dayDelta > 0 ? "is-positive" : dayDelta < 0 ? "is-negative" : ""}>{formatSigned(dayDelta)}</strong></div>
        <div><span>Операций</span><strong>{changes.length}</strong></div>
      </div>

      <div className="daily-energy-controls">
        <label className="daily-energy-amount">
          <span>Сколько процентов</span>
          <div><input type="number" min="1" max="100" inputMode="numeric" value={changeAmount} onChange={event => setChangeAmount(event.target.value)} /><b>%</b></div>
        </label>
        <label className="daily-energy-note">
          <span>Причина — необязательно</span>
          <input type="text" value={changeNote} onChange={event => setChangeNote(event.target.value)} placeholder="Например, работа или прогулка" maxLength={80} />
        </label>
        <div className="daily-energy-actions">
          <button type="button" className="app-button is-secondary energy-spend" onClick={() => changeEnergy(-1)}><Minus className="size-4" /> Списать</button>
          <button type="button" className="app-button energy-add" onClick={() => changeEnergy(1)}><Plus className="size-4" /> Добавить</button>
        </div>
      </div>

      {changes.length > 0 && (
        <div className="daily-energy-history">
          <div className="daily-energy-history-head"><span>Сегодня</span><b>История энергии</b></div>
          <div>
            {changes.map(change => (
              <article key={change.id}>
                <i className={change.delta > 0 ? "is-positive" : "is-negative"}>{change.delta > 0 ? <Plus className="size-3.5" /> : <Minus className="size-3.5" />}</i>
                <div><strong>{change.note || (change.delta > 0 ? "Энергия восстановлена" : "Расход энергии")}</strong><span>{new Date(change.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span></div>
                <b className={change.delta > 0 ? "is-positive" : "is-negative"}>{formatSigned(change.delta)}</b>
              </article>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
