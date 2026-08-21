import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowUp,
  BookOpen,
  BriefcaseBusiness,
  Castle,
  Clock3,
  Coins,
  Crown,
  Dumbbell,
  HeartHandshake,
  Home,
  Leaf,
  Palette,
  Plus,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import {
  useApp,
  type ActivityMicroGoal,
  type WorldCityState,
  type WorldFloor,
} from "@/contexts/AppContext";
import CoinDisplay from "@/components/CoinDisplay";
import FormModal from "@/components/FormModal";
import { FormInput } from "@/components/FormInputs";

type BuildingId = "study" | "work" | "health" | "creativity" | "relationships" | "rest";
type SelectedPlace = BuildingId | "home";

interface BuildingDefinition {
  id: BuildingId;
  name: string;
  district: string;
  description: string;
  color: string;
  icon: LucideIcon;
  plot: string;
  keywords: string[];
}

const BUILDINGS: BuildingDefinition[] = [
  { id: "study", name: "Дом знаний", district: "Квартал учёбы", description: "Языки, чтение, курсы и всё, чему вы учитесь.", color: "#6757e8", icon: BookOpen, plot: "plot-study", keywords: ["учёб", "учеб", "англий", "испан", "язык", "чтени", "курс", "образован"] },
  { id: "work", name: "Деловая башня", district: "Квартал дела", description: "Работа, бизнес, проекты и профессиональное развитие.", color: "#2577d8", icon: BriefcaseBusiness, plot: "plot-work", keywords: ["работ", "бизнес", "проект", "код", "заказ", "карьер"] },
  { id: "health", name: "Дом силы", district: "Квартал здоровья", description: "Спорт, тренировки, прогулки и забота о теле.", color: "#e85b52", icon: Dumbbell, plot: "plot-health", keywords: ["спорт", "трен", "зал", "бег", "йог", "здоров", "прогул"] },
  { id: "creativity", name: "Мастерская идей", district: "Творческий квартал", description: "Музыка, рисунок, письмо и личные проекты.", color: "#cf4eaa", icon: Palette, plot: "plot-creativity", keywords: ["твор", "рис", "музык", "пись", "дизайн", "фото", "иде"] },
  { id: "relationships", name: "Дом близких", district: "Сад отношений", description: "Время с семьёй, друзьями и важными людьми.", color: "#ef8a36", icon: HeartHandshake, plot: "plot-relationships", keywords: ["семь", "друз", "отнош", "общен", "встреч", "близк"] },
  { id: "rest", name: "Дом тишины", district: "Парк восстановления", description: "Осознанный отдых, медитация и восстановление.", color: "#24a977", icon: Leaf, plot: "plot-rest", keywords: ["отдых", "медита", "восстанов", "тишин", "сон", "релакс"] },
];

const LEVELS = [
  { hours: 0, name: "Участок" },
  { hours: 1, name: "Шалаш" },
  { hours: 5, name: "Уютный дом" },
  { hours: 20, name: "Таунхаус" },
  { hours: 50, name: "Особняк" },
  { hours: 120, name: "Башня" },
  { hours: 250, name: "Небоскрёб" },
  { hours: 500, name: "Пентхаус" },
];

const RESIDENT_SHOP = [
  { role: "Хранитель", emoji: "🧭", name: "Миро", cost: 12 },
  { role: "Архитектор", emoji: "🛠️", name: "Лея", cost: 25 },
  { role: "Мастер", emoji: "✨", name: "Энзо", cost: 40 },
];

const EMPTY_WORLD: WorldCityState = {
  homeLevel: 0,
  homeInvestedCoins: 0,
  buildingInvestments: {},
  floors: {},
  residents: [],
};

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("ru-RU");
}

function formatHours(seconds: number) {
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)} мин`;
  return `${hours.toLocaleString("ru-RU", { maximumFractionDigits: hours >= 100 ? 0 : 1 })} ч`;
}

function getLevel(hours: number) {
  let level = 0;
  LEVELS.forEach((item, index) => { if (hours >= item.hours) level = index; });
  return level;
}

function WorldBuildingArt({ level, investment, color, Icon, isHome = false }: { level: number; investment: number; color: string; Icon: LucideIcon; isHome?: boolean }) {
  const visibleFloors = level === 0 ? 0 : Math.min(7, Math.max(1, level + Math.min(2, investment)));
  const style = { "--building-color": color, "--building-floors": visibleFloors } as CSSProperties;
  return (
    <span className={`world-building-art level-${level} ${isHome ? "is-home" : ""}`} style={style} aria-hidden="true">
      {visibleFloors === 0 ? (
        <span className="world-building-site"><span /><span /><span /></span>
      ) : (
        <span className="world-building-stack">
          <span className="world-building-roof">{isHome && level >= 4 ? <Crown className="size-4" /> : null}</span>
          {Array.from({ length: visibleFloors }).map((_, index) => <span key={index} className="world-building-floor"><i /><i /><i /></span>)}
          <span className="world-building-door" />
          <span className="world-building-sign"><Icon className="size-4" /></span>
        </span>
      )}
      <span className="world-building-shadow" />
    </span>
  );
}

export default function WorldCity() {
  const {
    activitySessions,
    activityMicroGoals,
    addActivityMicroGoal,
    characterState,
    updateWorldCity,
    coins,
  } = useApp();
  const world = characterState.worldCity || EMPTY_WORLD;
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace>("study");
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [floorName, setFloorName] = useState("");
  const [activityName, setActivityName] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("30");
  const [rewardPerMinute, setRewardPerMinute] = useState("0,1");

  const buildingStats = useMemo(() => BUILDINGS.map((building) => {
    const floors = world.floors[building.id] || [];
    const floorActivities = floors.map((floor) => normalize(floor.activityName));
    const matchingSessions = activitySessions.filter((session) => {
      const title = normalize(session.title);
      return floorActivities.includes(title) || building.keywords.some((keyword) => title.includes(keyword));
    });
    const seconds = matchingSessions.reduce((sum, session) => sum + Math.max(0, session.durationSeconds), 0);
    const hours = seconds / 3600;
    const level = getLevel(hours);
    const next = LEVELS[level + 1];
    const currentThreshold = LEVELS[level].hours;
    const progress = next ? Math.min(100, ((hours - currentThreshold) / (next.hours - currentThreshold)) * 100) : 100;
    return { ...building, floors, matchingSessions, seconds, hours, level, next, progress };
  }), [activitySessions, world.floors]);

  const selectedBuilding = selectedPlace === "home" ? null : buildingStats.find((building) => building.id === selectedPlace) || buildingStats[0];
  const selectedResidents = world.residents.filter((resident) => resident.buildingId === selectedPlace);
  const totalSeconds = activitySessions.reduce((sum, session) => sum + Math.max(0, session.durationSeconds), 0);
  const cityLevel = Math.max(1, Math.floor(buildingStats.reduce((sum, building) => sum + building.level, 0) / 3) + world.homeLevel + 1);

  const saveWorld = (nextWorld: WorldCityState, cost: number, successMessage: string) => {
    if (!updateWorldCity(nextWorld, cost)) {
      toast.error(`Нужно ещё ${(cost - coins).toLocaleString("ru-RU")} монет`);
      return false;
    }
    toast.success(successMessage);
    return true;
  };

  const openFloorModal = () => {
    if (!selectedBuilding) return;
    setFloorName("");
    setActivityName("");
    setDailyMinutes("30");
    setRewardPerMinute("0,1");
    setIsFloorModalOpen(true);
  };

  const addFloor = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBuilding) return;
    const name = floorName.trim();
    const linkedActivity = (activityName.trim() || name).trim();
    if (!name || !linkedActivity) return;
    const existingFloors = world.floors[selectedBuilding.id] || [];
    if (existingFloors.some((floor) => normalize(floor.activityName) === normalize(linkedActivity))) {
      toast.error("Этаж с таким занятием уже существует");
      return;
    }
    const floor: WorldFloor = { id: nanoid(), name, activityName: linkedActivity, color: selectedBuilding.color, createdAt: new Date().toISOString() };
    const nextWorld = { ...world, floors: { ...world.floors, [selectedBuilding.id]: [...existingFloors, floor] } };
    if (!saveWorld(nextWorld, 0, `Этаж «${name}» заложен`)) return;

    if (!activityMicroGoals.some((goal) => normalize(goal.title) === normalize(linkedActivity))) {
      const targetMinutes = Math.max(1, Math.round(Number(dailyMinutes) || 30));
      const reward = Math.max(0, Number(rewardPerMinute.replace(",", ".")) || 0);
      const microGoal: ActivityMicroGoal = { id: nanoid(), title: linkedActivity, targetMinutes, rewardPerMinute: reward, color: selectedBuilding.color, createdAt: new Date().toISOString() };
      addActivityMicroGoal(microGoal);
    }
    setIsFloorModalOpen(false);
  };

  const investInBuilding = () => {
    if (!selectedBuilding) return;
    const current = world.buildingInvestments[selectedBuilding.id] || 0;
    if (current >= 5) return;
    const cost = 15 * (current + 1);
    saveWorld({ ...world, buildingInvestments: { ...world.buildingInvestments, [selectedBuilding.id]: current + 1 } }, cost, `${selectedBuilding.name} украшен и улучшен`);
  };

  const upgradeHome = () => {
    if (world.homeLevel >= 6) return;
    const cost = 25 * (world.homeLevel + 1);
    saveWorld({ ...world, homeLevel: world.homeLevel + 1, homeInvestedCoins: world.homeInvestedCoins + cost }, cost, "Главный дом вырос на новый уровень");
  };

  const buyResident = (template: typeof RESIDENT_SHOP[number]) => {
    if (world.residents.some((resident) => resident.buildingId === selectedPlace && resident.role === template.role)) return;
    saveWorld({
      ...world,
      residents: [...world.residents, { id: nanoid(), ...template, buildingId: selectedPlace, purchasedAt: new Date().toISOString() }],
    }, template.cost, `${template.name} теперь живёт в вашем городе`);
  };

  return (
    <section className="world-game">
      <header className="world-game-header">
        <div><span className="world-game-eyebrow"><Sparkles className="size-4" /> Экспериментальный режим</span><h2>Город вашей жизни</h2><p>Каждый час строит здания. Монеты превращают прогресс в жителей, детали и новые уровни дома.</p></div>
        <div className="world-game-stats">
          <div><Trophy className="size-4" /><span>Уровень города</span><strong>{cityLevel}</strong></div>
          <div><Clock3 className="size-4" /><span>Полезного времени</span><strong>{formatHours(totalSeconds)}</strong></div>
          <div><Users className="size-4" /><span>Жителей</span><strong>{world.residents.length}</strong></div>
          <div><Coins className="size-4" /><span>Казна</span><CoinDisplay amount={coins} size="sm" /></div>
        </div>
      </header>

      <div className="world-city-layout">
        <div className="world-map-card">
          <img className="world-map-art" src="/world/city-valley-v1.png" alt="Остров вашего города с шестью кварталами" />
          <span className="world-map-sun" />
          {buildingStats.map((building) => {
            const Icon = building.icon;
            const investment = world.buildingInvestments[building.id] || 0;
            return (
              <button key={building.id} type="button" className={`world-map-building ${building.plot} ${selectedPlace === building.id ? "is-selected" : ""}`} onClick={() => setSelectedPlace(building.id)} aria-label={`${building.name}, ${LEVELS[building.level].name}, ${formatHours(building.seconds)}`}>
                <WorldBuildingArt level={building.level} investment={investment} color={building.color} Icon={Icon} />
                <span className="world-map-label" style={{ "--building-color": building.color } as CSSProperties}><strong>{building.name}</strong><small>{formatHours(building.seconds)} · ур. {building.level}</small></span>
                {world.residents.some((resident) => resident.buildingId === building.id) && <span className="world-resident-bubble">{world.residents.filter((resident) => resident.buildingId === building.id).map((resident) => resident.emoji).join("")}</span>}
              </button>
            );
          })}
          <button type="button" className={`world-map-building plot-home ${selectedPlace === "home" ? "is-selected" : ""}`} onClick={() => setSelectedPlace("home")} aria-label={`Главный дом, уровень ${world.homeLevel + 1}`}>
            <WorldBuildingArt level={world.homeLevel + 1} investment={world.homeLevel} color="#e7a72e" Icon={Home} isHome />
            <span className="world-map-label is-home"><strong>Дом Дениса</strong><small>ур. {world.homeLevel + 1} · вложено {world.homeInvestedCoins}</small></span>
            {world.residents.some((resident) => resident.buildingId === "home") && <span className="world-resident-bubble">{world.residents.filter((resident) => resident.buildingId === "home").map((resident) => resident.emoji).join("")}</span>}
          </button>
          <div className="world-map-legend"><span><i className="is-time" /> Часы строят</span><span><i className="is-coins" /> Монеты оживляют</span></div>
        </div>

        <aside className="world-building-panel" style={{ "--building-color": selectedBuilding?.color || "#e7a72e" } as CSSProperties}>
          {selectedBuilding ? (
            <>
              <div className="world-panel-title"><span><selectedBuilding.icon className="size-5" /></span><div><small>{selectedBuilding.district}</small><h3>{selectedBuilding.name}</h3></div><b>ур. {selectedBuilding.level}</b></div>
              <p>{selectedBuilding.description}</p>
              <div className="world-level-card"><div><span>{LEVELS[selectedBuilding.level].name}</span><strong>{formatHours(selectedBuilding.seconds)}</strong></div><div className="world-level-track"><i style={{ width: `${selectedBuilding.progress}%` }} /></div><small>{selectedBuilding.next ? `До «${selectedBuilding.next.name}» ещё ${Math.max(0, selectedBuilding.next.hours - selectedBuilding.hours).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} ч` : "Высшая форма здания достигнута"}</small></div>
              <div className="world-panel-section-head"><div><span>Этажи занятий</span><small>Каждый этаж связан с названием в таймере</small></div><button type="button" className="icon-button is-small" onClick={openFloorModal} aria-label="Добавить этаж"><Plus className="size-4" /></button></div>
              <div className="world-floor-list">
                {(selectedBuilding.floors || []).length ? selectedBuilding.floors.map((floor, index) => {
                  const floorSeconds = activitySessions.filter((session) => normalize(session.title) === normalize(floor.activityName)).reduce((sum, session) => sum + session.durationSeconds, 0);
                  return <div key={floor.id}><span>{index + 1}</span><div><strong>{floor.name}</strong><small>В таймере: «{floor.activityName}»</small></div><b>{formatHours(floorSeconds)}</b></div>;
                }) : <button type="button" className="world-empty-floor" onClick={openFloorModal}><Plus className="size-4" /><span><strong>Заложить первый этаж</strong><small>Например, «Испанский» в доме учёбы</small></span></button>}
              </div>
              <button type="button" className="world-invest-button" onClick={investInBuilding} disabled={(world.buildingInvestments[selectedBuilding.id] || 0) >= 5}><ArrowUp className="size-4" /><span><strong>Улучшить оформление</strong><small>Декор и дополнительная высота</small></span><CoinDisplay amount={15 * ((world.buildingInvestments[selectedBuilding.id] || 0) + 1)} size="sm" /></button>
            </>
          ) : (
            <>
              <div className="world-panel-title"><span><Castle className="size-5" /></span><div><small>Центральная площадь</small><h3>Дом Дениса</h3></div><b>ур. {world.homeLevel + 1}</b></div>
              <p>Главный дом растёт за монеты и становится сердцем города. Здесь живут ваши первые помощники.</p>
              <div className="world-home-progress"><Crown className="size-6" /><div><span>Вложено в дом</span><strong>{world.homeInvestedCoins.toLocaleString("ru-RU")} монет</strong></div></div>
              <button type="button" className="world-invest-button is-primary" onClick={upgradeHome} disabled={world.homeLevel >= 6}><ArrowUp className="size-4" /><span><strong>{world.homeLevel >= 6 ? "Дом полностью улучшен" : "Новый уровень дома"}</strong><small>Больше этажей и статуса</small></span>{world.homeLevel < 6 && <CoinDisplay amount={25 * (world.homeLevel + 1)} size="sm" />}</button>
            </>
          )}

          <div className="world-panel-section-head"><div><span>Жители этого места</span><small>{selectedResidents.length ? selectedResidents.map((resident) => resident.name).join(", ") : "Пока здесь тихо"}</small></div><Users className="size-4" /></div>
          <div className="world-resident-shop">
            {RESIDENT_SHOP.map((resident) => {
              const owned = world.residents.some((item) => item.buildingId === selectedPlace && item.role === resident.role);
              return <button key={resident.role} type="button" onClick={() => buyResident(resident)} disabled={owned}><span>{resident.emoji}</span><div><strong>{resident.name}</strong><small>{resident.role}</small></div>{owned ? <b>Живёт здесь</b> : <CoinDisplay amount={resident.cost} size="sm" />}</button>;
            })}
          </div>
        </aside>
      </div>

      <div className="world-milestones">
        {LEVELS.slice(1).map((level, index) => <div key={level.hours}><span>{index + 1}</span><div><strong>{level.name}</strong><small>{level.hours}+ часов</small></div></div>)}
      </div>

      <FormModal title={`Новый этаж · ${selectedBuilding?.name || "Дом"}`} isOpen={isFloorModalOpen} onClose={() => setIsFloorModalOpen(false)} onSubmit={addFloor} submitText="Начать строительство">
        <p className="world-form-hint">После создания занятие появится в микроцелях таймера. Каждая записанная минута будет строить этот этаж.</p>
        <FormInput label="Название этажа" value={floorName} onChange={(value) => { setFloorName(value); if (!activityName) setActivityName(value); }} placeholder="Например, Испанский" />
        <FormInput label="Название занятия в таймере" value={activityName} onChange={setActivityName} placeholder="Испанский" />
        <div className="world-floor-form-grid"><FormInput label="Минут в день" value={dailyMinutes} onChange={setDailyMinutes} type="number" /><FormInput label="Монет за минуту" value={rewardPerMinute} onChange={setRewardPerMinute} placeholder="0,1" /></div>
      </FormModal>
    </section>
  );
}
