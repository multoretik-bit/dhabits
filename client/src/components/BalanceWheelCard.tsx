import { useState, type CSSProperties } from "react";
import { useApp } from "@/contexts/AppContext";

type WheelSystem = {
  id: string;
  aspect: string;
  color: string;
};

function BalanceWheel({
  systems,
  values,
  selectedId,
  onSelect,
}: {
  systems: WheelSystem[];
  values: Record<string, number>;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const cx = 130;
  const cy = 130;
  const radius = 91;
  const points = systems.map((system, index) => {
    const angle = (Math.PI * 2 * index) / systems.length - Math.PI / 2;
    const value = values[system.id] ?? 60;
    return `${cx + Math.cos(angle) * radius * (value / 100)},${cy + Math.sin(angle) * radius * (value / 100)}`;
  }).join(" ");

  return (
    <svg className="balance-wheel" viewBox="0 0 260 260" role="img" aria-label="Колесо баланса">
      <defs>
        <linearGradient id="balanceFill" x1="45" y1="31" x2="219" y2="228" gradientUnits="userSpaceOnUse">
          <stop stopColor="#315cff" stopOpacity=".48" />
          <stop offset=".55" stopColor="#7765f5" stopOpacity=".38" />
          <stop offset="1" stopColor="#ff6b35" stopOpacity=".38" />
        </linearGradient>
      </defs>
      {[20, 40, 60, 80, 100].map(level => {
        const gridPoints = systems.map((_, index) => {
          const angle = (Math.PI * 2 * index) / systems.length - Math.PI / 2;
          return `${cx + Math.cos(angle) * radius * (level / 100)},${cy + Math.sin(angle) * radius * (level / 100)}`;
        }).join(" ");
        return <polygon key={level} points={gridPoints} className="balance-grid" />;
      })}
      {systems.map((system, index) => {
        const angle = (Math.PI * 2 * index) / systems.length - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        const labelX = cx + Math.cos(angle) * 115;
        const labelY = cy + Math.sin(angle) * 115;
        return (
          <g key={system.id} onClick={() => onSelect(system.id)} className="balance-axis">
            <line x1={cx} y1={cy} x2={x} y2={y} />
            <circle cx={labelX} cy={labelY} r={selectedId === system.id ? 11 : 8} fill={system.color || "#315cff"} />
            <text x={labelX} y={labelY + 3}>{index + 1}</text>
          </g>
        );
      })}
      <polygon points={points} className="balance-value" />
      {systems.map((system, index) => {
        const angle = (Math.PI * 2 * index) / systems.length - Math.PI / 2;
        const value = values[system.id] ?? 60;
        return <circle key={system.id} cx={cx + Math.cos(angle) * radius * (value / 100)} cy={cy + Math.sin(angle) * radius * (value / 100)} r="4.5" fill={system.color || "#315cff"} className="balance-point" />;
      })}
    </svg>
  );
}

export default function BalanceWheelCard() {
  const { identitySystems, characterState, updateCharacterState } = useApp();
  const safeSystems = (Array.isArray(identitySystems) ? identitySystems : []).filter(
    (system): system is WheelSystem => Boolean(system && typeof system.id === "string" && typeof system.aspect === "string"),
  );
  const [selectedBalanceId, setSelectedBalanceId] = useState(safeSystems[0]?.id || "");
  const selectedId = safeSystems.some(system => system.id === selectedBalanceId) ? selectedBalanceId : (safeSystems[0]?.id || "");
  const selectedSystem = safeSystems.find(system => system.id === selectedId);
  const balance = characterState.balance && typeof characterState.balance === "object" && !Array.isArray(characterState.balance)
    ? characterState.balance
    : {};
  const averageBalance = safeSystems.length
    ? Math.round(safeSystems.reduce((sum, system) => {
      const value = Number(balance[system.id]);
      return sum + (Number.isFinite(value) ? value : 60);
    }, 0) / safeSystems.length)
    : 0;

  if (!safeSystems.length) return null;

  const updateBalance = (id: string, value: number) => {
    updateCharacterState({ balance: { ...balance, [id]: value } });
  };

  return (
    <article className="profile-wheel-card profile-balance-returned app-surface">
      <div className="profile-card-head">
        <div><p>Колесо баланса</p><h2>{averageBalance}%</h2></div>
        <div className="profile-balance-score">Сегодня</div>
      </div>
      <div className="profile-wheel-body">
        <BalanceWheel systems={safeSystems} values={balance} selectedId={selectedId} onSelect={setSelectedBalanceId} />
        <div className="profile-sphere-list">
          {safeSystems.map((system, index) => (
            <button key={system.id} type="button" className={selectedId === system.id ? "is-active" : ""} onClick={() => setSelectedBalanceId(system.id)}>
              <i style={{ backgroundColor: system.color || "#315cff" }}>{index + 1}</i>
              <span>{system.aspect}</span>
              <strong>{balance[system.id] ?? 60}</strong>
            </button>
          ))}
        </div>
      </div>
      {selectedSystem && (
        <div className="profile-balance-editor" style={{ "--sphere-color": selectedSystem.color || "#315cff" } as CSSProperties}>
          <div><span>{selectedSystem.aspect}</span><strong>{balance[selectedSystem.id] ?? 60}%</strong></div>
          <input type="range" min="0" max="100" step="5" value={balance[selectedSystem.id] ?? 60} onChange={event => updateBalance(selectedSystem.id, Number(event.target.value))} />
        </div>
      )}
    </article>
  );
}
