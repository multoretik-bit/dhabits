import { useMemo, useState } from "react";
import { Check, ChevronRight, Home, Package, PawPrint, Plus, Shirt, ShoppingBag, Sparkles, Star, UserRound, Zap } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, getNextCharacterLevelCost, type ShopItem } from "@/contexts/AppContext";
import { EmptyState, PageHeader, PageShell } from "@/components/AppUI";
import ProfileDailyDashboard from "@/components/ProfileDailyDashboard";
import BalanceWheelCard from "@/components/BalanceWheelCard";
import PomodoroTracker from "@/components/PomodoroTracker";
import CoinDisplay from "@/components/CoinDisplay";
import FormModal from "@/components/FormModal";
import { FormInput, FormSelect, FormTextArea } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import { RarityBadge } from "@/components/RarityBadge";

const CATEGORIES = [
  { value: "all", label: "Все покупки" },
  { value: "costume", label: "Костюмы" },
  { value: "pants", label: "Штаны" },
  { value: "headwear", label: "Головные уборы" },
  { value: "pets", label: "Питомцы" },
  { value: "background", label: "Дома и квартиры" },
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
  if (item.avatarPath) return (
    <span className="profile-shop-avatar-stack">
      <img className={`profile-shop-avatar-model ${item.category === "costume" || item.category === "pants" ? "is-outfit-model" : ""}`} src={item.avatarPath} alt="" />
      {item.category === "costume" || item.category === "pants" ? <img className="profile-shop-head-layer" src="/profile-avatar.png" alt="" /> : null}
    </span>
  );
  const assetPath = typeof item.assetPath === "string" ? item.assetPath : "";
  if (assetPath && /\.(png|svg|jpe?g|webp)$/i.test(assetPath)) return <img src={assetPath} alt="" />;
  if (assetPath.trim().startsWith("<")) return <svg viewBox="0 0 100 150" aria-hidden="true"><g dangerouslySetInnerHTML={{ __html: assetPath }} /></svg>;
  return <span>{item.emoji}</span>;
}

type ProfileTab = "profile" | "purchases";
type InventoryStatus = "purchased" | "available" | "all";

export default function ShopPage() {
  const {
    coins,
    shopItems,
    characterState,
    addShopItem,
    purchaseItem,
    equipItem,
    unequipItem,
    levelUpCharacter,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>("all");
  const [inventoryCategory, setInventoryCategory] = useState("all");
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemEmoji, setItemEmoji] = useState("🎁");
  const [itemPrice, setItemPrice] = useState("50");
  const [itemCategory, setItemCategory] = useState<ShopItem["category"]>("reward");
  const [itemSlot, setItemSlot] = useState<NonNullable<ShopItem["slot"]>>("accessory");
  const [itemRarity, setItemRarity] = useState<ShopItem["rarity"]>("common");
  const [itemDescription, setItemDescription] = useState("");
  const today = useMemo(() => new Date(), []);
  const lifeDay = useMemo(() => {
    const birthDateUtc = Date.UTC(2004, 8, 14);
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.floor((todayUtc - birthDateUtc) / 86_400_000) + 1;
  }, [today]);

  const safeShopItems = Array.isArray(shopItems) ? shopItems : [];
  const level = typeof characterState.level === "number" && Number.isFinite(characterState.level) ? characterState.level : 0;
  const nextLevelCost = getNextCharacterLevelCost(level);
  const purchasedCount = safeShopItems.filter(item => item?.purchased).length;
  const availableCount = safeShopItems.filter(item => item && !item.purchased).length;
  const visibleItems = useMemo(() => safeShopItems.filter(item => {
    if (!item) return false;
    if (inventoryCategory !== "all" && item.category !== inventoryCategory) return false;
    if (inventoryStatus === "purchased") return item.purchased;
    if (inventoryStatus === "available") return !item.purchased;
    return true;
  }).sort((a, b) => {
    const order = ["costume", "pants", "headwear", "pets", "background", "reward"];
    const categoryDiff = order.indexOf(a.category) - order.indexOf(b.category);
    if (categoryDiff) return categoryDiff;
    const family = (item: ShopItem) => item.id.includes("tshirt") ? "cloth-tshirt" : item.id.split("-v")[0].replace(/-(classic|modern|cozy|cyberpunk).*$/, "");
    const familyA = family(a);
    const familyB = family(b);
    return familyA.localeCompare(familyB, "ru") || a.price - b.price;
  }), [safeShopItems, inventoryCategory, inventoryStatus]);

  const equipped = useMemo(() => ({
    costume: safeShopItems.find(item => item.id === characterState.body),
    pants: safeShopItems.find(item => item.id === characterState.feet),
    headwear: safeShopItems.find(item => item.id === characterState.head),
    pet: safeShopItems.find(item => item.id === characterState.pet),
    background: safeShopItems.find(item => item.id === characterState.background),
    vehicle: safeShopItems.find(item => item.id === characterState.vehicle),
  }), [safeShopItems, characterState.body, characterState.feet, characterState.head, characterState.pet, characterState.background, characterState.vehicle]);

  const showCategory = (category: string) => {
    setInventoryCategory(category);
    setInventoryStatus("all");
  };

  const baseAvatarPath = equipped.costume?.avatarPath || equipped.pants?.avatarPath || "/profile-avatar.png";
  const baseAvatarName = equipped.costume?.name || equipped.pants?.name || "Базовый образ";

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
    else toast.success(`${item.name} теперь в покупках`);
  };

  const isEquipped = (item: ShopItem) => Boolean(item.slot && characterState[item.slot] === item.id);

  return (
    <PageShell className="profile-page">
      <PageHeader
        eyebrow="Личный центр"
        title={activeTab === "profile" ? "Мой профиль" : "Покупки"}
        description={activeTab === "profile" ? "Персонаж и всё важное о сегодняшнем дне — в одном месте." : "Костюмы, штаны, головные уборы, питомцы, жильё и награды."}
        actions={<div className="profile-balance"><span>Баланс</span><CoinDisplay amount={coins} size="lg" /></div>}
      />

      <nav className="profile-page-tabs" aria-label="Разделы профиля">
        <button type="button" className={activeTab === "profile" ? "is-active" : ""} onClick={() => setActiveTab("profile")}><UserRound className="size-4" /> Профиль</button>
        <button type="button" className={activeTab === "purchases" ? "is-active" : ""} onClick={() => setActiveTab("purchases")}><ShoppingBag className="size-4" /> Покупки <span>{safeShopItems.length}</span></button>
      </nav>

      {activeTab === "profile" ? (
        <>
          <section className="profile-avatar-hero app-surface">
            <span className="profile-avatar-glow is-one" />
            <span className="profile-avatar-glow is-two" />
            <div className="profile-avatar-frame"><img src="/profile-avatar.png" alt="Мой 2D-персонаж" /></div>
            <div className="profile-avatar-copy">
              <span className="profile-avatar-kicker"><Sparkles className="size-4" /> День {lifeDay.toLocaleString("ru-RU")} · с 14 сентября 2004 года</span>
              <h2>Добрый день, Денис.<br />Сегодня ваш <span className="profile-life-day">{lifeDay.toLocaleString("ru-RU")}-й день.</span></h2>
              <p>Ваш капитал, полезное время и энергия сегодня — всё самое важное в одном месте.</p>
              <div className="profile-avatar-stats">
                <div><span>Уровень</span><strong>{level || 1}</strong></div>
                <div><span>В коллекции</span><strong>{purchasedCount}</strong></div>
                <div><span>До уровня</span><strong>{nextLevelCost} монет</strong></div>
              </div>
              <button type="button" className="app-button profile-level-button" onClick={handleLevelUp}><Zap className="size-4" /> Повысить уровень</button>
            </div>
            <div className="profile-level-orbit"><Star className="size-4" /> LVL {level || 1}</div>
          </section>

          <ProfileDailyDashboard />
          <div className="profile-tools-grid">
            <PomodoroTracker selectedDate={today} />
            <BalanceWheelCard />
          </div>
        </>
      ) : (
        <section className="profile-inventory-page profile-purchases-page">
          <div className="profile-purchases-scene app-surface">
            <div className="profile-sky" aria-hidden="true"><span className="profile-cloud cloud-one" /><span className="profile-cloud cloud-two" /><span className="profile-cloud cloud-three" /><span className="profile-sun" /></div>
            <div className="profile-purchases-scene-copy">
              <span><Sparkles className="size-4" /> Моя игровая коллекция</span>
              <h2>Ваш образ и пространство</h2>
              <p>Надевайте вещи — Денис, питомцы и купленные предметы сразу появляются в этой сцене.</p>
              <div className="profile-wardrobe-shortcuts">
                <button type="button" onClick={() => showCategory("costume")}><Shirt className="size-4" /> Костюмы</button>
                <button type="button" onClick={() => showCategory("pants")}>👖 Штаны</button>
                <button type="button" onClick={() => showCategory("headwear")}>🧢 Головные уборы</button>
              </div>
            </div>
            <div className="profile-game-scene">
              <div className="profile-scene-ground" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
              {equipped.background ? <button type="button" className="profile-scene-object is-home" onClick={() => showCategory("background")}><ItemPreview item={equipped.background} /><span>{equipped.background.name}</span></button> : <button type="button" className="profile-scene-empty is-home" onClick={() => showCategory("background")}><Home className="size-5" /> Выбрать жильё</button>}
              {equipped.vehicle ? <button type="button" className="profile-scene-object is-vehicle" onClick={() => showCategory("reward")}><ItemPreview item={equipped.vehicle} /><span>{equipped.vehicle.name}</span></button> : null}
              <button type="button" className="profile-scene-avatar" onClick={() => showCategory("costume")} aria-label="Выбрать костюм">
                <img className={baseAvatarPath !== "/profile-avatar.png" ? "has-outfit-model" : ""} src={baseAvatarPath} alt={`Денис: ${baseAvatarName}`} />
                {baseAvatarPath !== "/profile-avatar.png" ? <img className="profile-character-head-layer" src="/profile-avatar.png" alt="" /> : null}
                {equipped.headwear?.avatarPath ? <img className="profile-headwear-layer" src={equipped.headwear.avatarPath} alt="" /> : null}
                <span><Shirt className="size-3" /> {baseAvatarName}</span>
              </button>
              {equipped.pet ? <button type="button" className="profile-scene-object is-pet" onClick={() => showCategory("pets")}><ItemPreview item={equipped.pet} /><span>{equipped.pet.name}</span></button> : <button type="button" className="profile-scene-empty is-pet" onClick={() => showCategory("pets")}><PawPrint className="size-5" /> Выбрать питомца</button>}
            </div>
          </div>

          <div className="profile-section-head">
            <div><p className="page-eyebrow">Мои покупки</p><h2>Соберите своё пространство</h2><small>Похожие предметы стоят рядом — от простых моделей к редким.</small></div>
            <button type="button" className="app-button is-secondary" onClick={() => setShowCreateItem(true)}><Plus className="size-4" /> Свой предмет</button>
          </div>

          <div className="profile-inventory-status">
            <button type="button" className={inventoryStatus === "purchased" ? "is-active" : ""} onClick={() => setInventoryStatus("purchased")}><Check className="size-4" /> Куплено <span>{purchasedCount}</span></button>
            <button type="button" className={inventoryStatus === "available" ? "is-active" : ""} onClick={() => setInventoryStatus("available")}><ShoppingBag className="size-4" /> Не куплено <span>{availableCount}</span></button>
            <button type="button" className={inventoryStatus === "all" ? "is-active" : ""} onClick={() => setInventoryStatus("all")}><Package className="size-4" /> Всё <span>{safeShopItems.length}</span></button>
          </div>

          <div className="profile-category-row">{CATEGORIES.map(category => <button key={category.value} type="button" className={inventoryCategory === category.value ? "is-active" : ""} onClick={() => setInventoryCategory(category.value)}>{category.label}</button>)}</div>

          {visibleItems.length ? (
            <div className="profile-item-grid">
              {visibleItems.map(item => (
                <article key={item.id} className={`profile-item-card ${isEquipped(item) ? "is-equipped" : ""}`}>
                  <div className="profile-item-preview">
                    <ItemPreview item={item} />
                    {item.purchased ? <span className="profile-equipped"><Check className="size-3" /> {isEquipped(item) ? "Надето" : "Куплено"}</span> : <span className="profile-item-price"><CoinDisplay amount={item.price} size="sm" /></span>}
                  </div>
                  <div className="profile-item-copy"><RarityBadge rarity={item.rarity} /><h3>{item.name}</h3><p>{item.description || "Предмет вашей коллекции"}</p></div>
                  {item.purchased ? (
                    item.slot ? <button type="button" className={`app-button ${isEquipped(item) ? "is-secondary" : ""}`} onClick={() => isEquipped(item) ? unequipItem(item.slot!) : equipItem(item.id)}>{isEquipped(item) ? "Снять" : "Надеть"}</button> : <div className="profile-owned-label"><Check className="size-4" /> В коллекции</div>
                  ) : <button type="button" className="app-button" onClick={() => purchase(item)} disabled={coins < item.price}><ShoppingBag className="size-4" /> Получить <ChevronRight className="size-4" /></button>}
                </article>
              ))}
            </div>
          ) : <EmptyState icon={Package} title="Здесь пока пусто" description="Попробуйте выбрать другой статус или категорию." />}
        </section>
      )}

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
