import { useMemo, useState } from "react";
import {
  BatteryCharging,
  Brain,
  Check,
  ChevronRight,
  Dumbbell,
  Heart,
  Package,
  Palette,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  SunMedium,
  UserRound,
  Zap,
} from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, getNextCharacterLevelCost, type CharacterState, type ShopItem } from "@/contexts/AppContext";
import { EmptyState, PageHeader, PageShell, SectionHeading } from "@/components/AppUI";
import CharacterDisplay from "@/components/CharacterDisplay";
import CoinDisplay from "@/components/CoinDisplay";
import FormModal from "@/components/FormModal";
import { FormInput, FormSelect, FormTextArea } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import { RarityBadge } from "@/components/RarityBadge";

const APPEARANCE_OPTIONS = {
  skin: ["#F3C99B", "#DFA06C", "#B97044", "#7C452B"],
  hair: ["#4A3020", "#8A5A3A", "#D6A24C", "#20242E"],
  shirt: ["#315CFF", "#7765F5", "#FF6B35", "#149C76", "#F04E7A"],
  pants: ["#334155", "#1E3A8A", "#4C1D95", "#292524"],
} as const;

const APPEARANCE_LABELS: Record<keyof typeof APPEARANCE_OPTIONS, string> = {
  skin: "Тон кожи",
  hair: "Волосы",
  shirt: "Футболка",
  pants: "Брюки",
};

const ATTRIBUTES = [
  { id: "energy", label: "Энергия", icon: BatteryCharging, color: "#ff9f1c" },
  { id: "selfLove", label: "Любовь к себе", icon: Heart, color: "#f04e7a" },
  { id: "focus", label: "Фокус", icon: Brain, color: "#315cff" },
  { id: "confidence", label: "Уверенность", icon: ShieldCheck, color: "#7765f5" },
  { id: "discipline", label: "Дисциплина", icon: Dumbbell, color: "#149c76" },
  { id: "calm", label: "Спокойствие", icon: SunMedium, color: "#e0a400" },
];

const CATEGORIES = [
  { value: "all", label: "Все" },
  { value: "clothing", label: "Одежда" },
  { value: "pets", label: "Питомцы" },
  { value: "background", label: "Пространство" },
  { value: "vehicle", label: "Транспорт" },
  { value: "reward", label: "Награды" },
] as const;

const ITEM_CATEGORIES = CATEGORIES.filter(item => item.value !== "all");
const ITEM_SLOTS = [
  { value: "head", label: "Голова" },
  { value: "body", label: "Тело" },
  { value: "hands", label: "Руки" },
  { value: "feet", label: "Ноги" },
  { value: "accessory", label: "Аксессуар" },
  { value: "background", label: "Фон" },
  { value: "vehicle", label: "Транспорт" },
  { value: "pet", label: "Питомец" },
];

function ItemPreview({ item }: { item: ShopItem }) {
  if (item.assetPath && /\.(png|svg|jpe?g|webp)$/i.test(item.assetPath)) {
    return <img src={item.assetPath} alt="" />;
  }
  if (item.assetPath?.trim().startsWith("<")) {
    return <svg viewBox="0 0 100 150" aria-hidden="true"><g dangerouslySetInnerHTML={{ __html: item.assetPath }} /></svg>;
  }
  return <span>{item.emoji}</span>;
}

function BalanceWheel({
  systems,
  values,
  selectedId,
  onSelect,
}: {
  systems: { id: string; aspect: string; color: string }[];
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
    <svg className="balance-wheel" viewBox="0 0 260 260" role="img" aria-label="Колесо баланса из десяти сфер">
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
        return <g key={system.id} onClick={() => onSelect(system.id)} className="balance-axis"><line x1={cx} y1={cy} x2={x} y2={y} /><circle cx={labelX} cy={labelY} r={selectedId === system.id ? 11 : 8} fill={system.color} /><text x={labelX} y={labelY + 3}>{index + 1}</text></g>;
      })}
      <polygon points={points} className="balance-value" />
      {systems.map((system, index) => {
        const angle = (Math.PI * 2 * index) / systems.length - Math.PI / 2;
        const value = values[system.id] ?? 60;
        return <circle key={system.id} cx={cx + Math.cos(angle) * radius * (value / 100)} cy={cy + Math.sin(angle) * radius * (value / 100)} r="4.5" fill={system.color} className="balance-point" />;
      })}
    </svg>
  );
}

export default function ShopPage() {
  const {
    coins,
    shopItems,
    characterState,
    identitySystems,
    updateCharacterState,
    addShopItem,
    purchaseItem,
    equipItem,
    unequipItem,
    levelUpCharacter,
  } = useApp();

  const [selectedBalanceId, setSelectedBalanceId] = useState(identitySystems[0]?.id || "1");
  const [inventoryCategory, setInventoryCategory] = useState("all");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemEmoji, setItemEmoji] = useState("🎁");
  const [itemPrice, setItemPrice] = useState("50");
  const [itemCategory, setItemCategory] = useState<ShopItem["category"]>("reward");
  const [itemSlot, setItemSlot] = useState<NonNullable<ShopItem["slot"]>>("accessory");
  const [itemRarity, setItemRarity] = useState<ShopItem["rarity"]>("common");
  const [itemDescription, setItemDescription] = useState("");

  const level = characterState.level || 0;
  const nextLevelCost = getNextCharacterLevelCost(level);
  const balance = characterState.balance || {};
  const attributes = characterState.attributes || {};
  const appearance = characterState.appearance || {};
  const purchasedItems = useMemo(() => shopItems.filter(item => item.purchased && (inventoryCategory === "all" || item.category === inventoryCategory)), [shopItems, inventoryCategory]);
  const availableItems = useMemo(() => shopItems.filter(item => !item.purchased && (catalogCategory === "all" || item.category === catalogCategory)), [shopItems, catalogCategory]);
  const selectedSystem = identitySystems.find(system => system.id === selectedBalanceId) || identitySystems[0];
  const averageBalance = identitySystems.length ? Math.round(identitySystems.reduce((sum, system) => sum + (balance[system.id] ?? 60), 0) / identitySystems.length) : 0;

  const updateAppearance = (key: keyof typeof APPEARANCE_OPTIONS, value: string) => {
    updateCharacterState({ appearance: { ...appearance, [key]: value } });
  };

  const updateBalance = (id: string, value: number) => {
    updateCharacterState({ balance: { ...balance, [id]: value } });
  };

  const updateAttribute = (id: string, value: number) => {
    updateCharacterState({ attributes: { ...attributes, [id]: value } });
  };

  const handleLevelUp = () => {
    if (!levelUpCharacter()) toast.error("Недостаточно монет для нового уровня");
    else toast.success("Персонаж получил новый уровень");
  };

  const handleCreateItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!itemName.trim()) return;
    addShopItem({
      id: nanoid(),
      name: itemName.trim(),
      emoji: itemEmoji,
      price: Number(itemPrice) || 0,
      category: itemCategory,
      slot: itemSlot,
      folder: "default",
      purchased: false,
      createdAt: new Date().toISOString(),
      rarity: itemRarity,
      description: itemDescription.trim(),
    });
    setShowCreateItem(false);
    setItemName("");
    setItemDescription("");
    toast.success("Предмет добавлен в коллекцию");
  };

  const purchase = (item: ShopItem) => {
    if (!purchaseItem(item.id)) toast.error("Недостаточно монет");
    else toast.success(`${item.name} теперь в инвентаре`);
  };

  const isEquipped = (item: ShopItem) => Boolean(item.slot && characterState[item.slot] === item.id);

  return (
    <PageShell className="profile-page">
      <PageHeader
        eyebrow="Ваше состояние"
        title="Профиль"
        description="Персонаж, баланс жизненных сфер, внутренние характеристики и коллекция наград — в одном месте."
        actions={<div className="profile-balance"><span>Баланс</span><CoinDisplay amount={coins} size="lg" /></div>}
      />

      <section className="profile-hero-grid">
        <article className="profile-character-card">
          <span className="profile-orb profile-orb-one" />
          <span className="profile-orb profile-orb-two" />
          <div className="profile-card-head">
            <div><p>Мой персонаж</p><h2>Уровень {level}</h2></div>
            <div className="profile-level-badge"><Star className="size-4" /> {level || 1}</div>
          </div>
          <div className="profile-character-stage">
            <CharacterDisplay width={235} height={350} level={level} showLevelBadge />
          </div>
          <div className="profile-level-row">
            <div><span>Следующий уровень</span><strong>{nextLevelCost} монет</strong></div>
            <button type="button" className="app-button" onClick={handleLevelUp}><Zap className="size-4" /> Прокачать</button>
          </div>
          <details className="profile-customizer">
            <summary><span><Palette className="size-4" /> Настроить внешность</span><ChevronRight className="size-4" /></summary>
            <div className="profile-color-groups">
              {(Object.keys(APPEARANCE_OPTIONS) as (keyof typeof APPEARANCE_OPTIONS)[]).map(key => (
                <div key={key} className="profile-color-group">
                  <span>{APPEARANCE_LABELS[key]}</span>
                  <div>{APPEARANCE_OPTIONS[key].map(color => <button key={color} type="button" className={(appearance[key] || APPEARANCE_OPTIONS[key][0]) === color ? "is-active" : ""} style={{ backgroundColor: color }} onClick={() => updateAppearance(key, color)} aria-label={`${APPEARANCE_LABELS[key]} ${color}`}>{(appearance[key] || APPEARANCE_OPTIONS[key][0]) === color && <Check className="size-3.5" />}</button>)}</div>
                </div>
              ))}
            </div>
          </details>
        </article>

        <article className="profile-wheel-card app-surface">
          <div className="profile-card-head">
            <div><p>Колесо баланса</p><h2>{averageBalance}%</h2></div>
            <div className="profile-balance-score">Сегодня</div>
          </div>
          <div className="profile-wheel-body">
            <BalanceWheel systems={identitySystems} values={balance} selectedId={selectedBalanceId} onSelect={setSelectedBalanceId} />
            <div className="profile-sphere-list">
              {identitySystems.map((system, index) => <button key={system.id} type="button" className={selectedBalanceId === system.id ? "is-active" : ""} onClick={() => setSelectedBalanceId(system.id)}><i style={{ backgroundColor: system.color }}>{index + 1}</i><span>{system.aspect}</span><strong>{balance[system.id] ?? 60}</strong></button>)}
            </div>
          </div>
          {selectedSystem && <div className="profile-balance-editor" style={{ "--sphere-color": selectedSystem.color } as React.CSSProperties}><div><span>{selectedSystem.aspect}</span><strong>{balance[selectedSystem.id] ?? 60}%</strong></div><input type="range" min="0" max="100" step="5" value={balance[selectedSystem.id] ?? 60} onChange={event => updateBalance(selectedSystem.id, Number(event.target.value))} /></div>}
        </article>
      </section>

      <section className="profile-attributes app-surface">
        <SectionHeading icon={Sparkles} title="Мои характеристики" meta="Как я чувствую себя сейчас" />
        <div className="profile-attribute-grid">
          {ATTRIBUTES.map(attribute => {
            const Icon = attribute.icon;
            const value = attributes[attribute.id] ?? 60;
            return <div key={attribute.id} className="profile-attribute" style={{ "--attribute-color": attribute.color } as React.CSSProperties}><div className="profile-attribute-icon"><Icon className="size-5" /></div><div className="profile-attribute-copy"><div><span>{attribute.label}</span><strong>{value}%</strong></div><input type="range" min="0" max="100" step="5" value={value} onChange={event => updateAttribute(attribute.id, Number(event.target.value))} /></div></div>;
          })}
        </div>
      </section>

      <section className="profile-collection-section">
        <div className="profile-section-head"><div><p className="page-eyebrow">Моя коллекция</p><h2>Инвентарь</h2></div><Package className="size-6" /></div>
        <div className="profile-category-row">{CATEGORIES.map(category => <button key={category.value} type="button" className={inventoryCategory === category.value ? "is-active" : ""} onClick={() => setInventoryCategory(category.value)}>{category.label}</button>)}</div>
        {purchasedItems.length ? <div className="profile-item-grid">{purchasedItems.map(item => <article key={item.id} className={`profile-item-card ${isEquipped(item) ? "is-equipped" : ""}`}><div className="profile-item-preview"><ItemPreview item={item} />{isEquipped(item) && <span className="profile-equipped"><Check className="size-3" /> Надето</span>}</div><div className="profile-item-copy"><RarityBadge rarity={item.rarity} /><h3>{item.name}</h3><p>{item.description || "Предмет вашей коллекции"}</p></div>{item.slot && <button type="button" className={`app-button ${isEquipped(item) ? "is-secondary" : ""}`} onClick={() => isEquipped(item) ? unequipItem(item.slot!) : equipItem(item.id)}>{isEquipped(item) ? "Снять" : "Надеть"}</button>}</article>)}</div> : <EmptyState icon={Package} title="Инвентарь пока пуст" description="Полученные и купленные предметы появятся здесь." />}
      </section>

      <section className="profile-collection-section">
        <div className="profile-section-head"><div><p className="page-eyebrow">Награды за развитие</p><h2>Предметы</h2></div><button type="button" className="app-button is-secondary" onClick={() => setShowCreateItem(true)}><Plus className="size-4" /> Свой предмет</button></div>
        <div className="profile-category-row">{CATEGORIES.map(category => <button key={category.value} type="button" className={catalogCategory === category.value ? "is-active" : ""} onClick={() => setCatalogCategory(category.value)}>{category.label}</button>)}</div>
        {availableItems.length ? <div className="profile-item-grid">{availableItems.map(item => <article key={item.id} className="profile-item-card"><div className="profile-item-preview"><ItemPreview item={item} /><span className="profile-item-price"><CoinDisplay amount={item.price} size="sm" /></span></div><div className="profile-item-copy"><RarityBadge rarity={item.rarity} /><h3>{item.name}</h3><p>{item.description || "Новая награда для вашего персонажа"}</p></div><button type="button" className="app-button" onClick={() => purchase(item)} disabled={coins < item.price}><ShoppingBag className="size-4" /> Получить <ChevronRight className="size-4" /></button></article>)}</div> : <EmptyState icon={ShoppingBag} title="В этой категории всё собрано" description="Попробуйте выбрать другую категорию." />}
      </section>

      <FormModal title="Новый предмет" isOpen={showCreateItem} onClose={() => setShowCreateItem(false)} onSubmit={handleCreateItem} submitText="Добавить">
        <FormInput label="Название" value={itemName} onChange={setItemName} placeholder="Например, день у моря" />
        <EmojiPicker label="Эмодзи" value={itemEmoji} onChange={setItemEmoji} />
        <FormInput label="Цена в монетах" value={itemPrice} onChange={setItemPrice} type="number" />
        <FormSelect label="Категория" value={itemCategory} onChange={value => setItemCategory(value as ShopItem["category"])} options={ITEM_CATEGORIES.map(item => ({ value: item.value, label: item.label }))} />
        <FormSelect label="Слот персонажа" value={itemSlot} onChange={value => setItemSlot(value as NonNullable<ShopItem["slot"]>)} options={ITEM_SLOTS} />
        <FormSelect label="Редкость" value={itemRarity} onChange={value => setItemRarity(value as ShopItem["rarity"])} options={[{ value: "common", label: "Обычный" }, { value: "rare", label: "Редкий" }, { value: "epic", label: "Эпический" }, { value: "legendary", label: "Легендарный" }, { value: "legacy", label: "Раритет" }]} />
        <FormTextArea label="Описание" value={itemDescription} onChange={setItemDescription} />
      </FormModal>
    </PageShell>
  );
}
