import { useMemo, useState } from "react";
import { Check, ChevronRight, Package, Plus, ShoppingBag, Sparkles, Star, UserRound, Zap } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useApp, getNextCharacterLevelCost, type ShopItem } from "@/contexts/AppContext";
import { EmptyState, PageHeader, PageShell } from "@/components/AppUI";
import ProfileDailyDashboard from "@/components/ProfileDailyDashboard";
import BalanceWheelCard from "@/components/BalanceWheelCard";
import CoinDisplay from "@/components/CoinDisplay";
import FormModal from "@/components/FormModal";
import { FormInput, FormSelect, FormTextArea } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import { RarityBadge } from "@/components/RarityBadge";

const CATEGORIES = [
  { value: "all", label: "Все категории" },
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
  const assetPath = typeof item.assetPath === "string" ? item.assetPath : "";
  if (assetPath && /\.(png|svg|jpe?g|webp)$/i.test(assetPath)) return <img src={assetPath} alt="" />;
  if (assetPath.trim().startsWith("<")) return <svg viewBox="0 0 100 150" aria-hidden="true"><g dangerouslySetInnerHTML={{ __html: assetPath }} /></svg>;
  return <span>{item.emoji}</span>;
}

type ProfileTab = "profile" | "inventory";
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
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>("purchased");
  const [inventoryCategory, setInventoryCategory] = useState("all");
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemEmoji, setItemEmoji] = useState("🎁");
  const [itemPrice, setItemPrice] = useState("50");
  const [itemCategory, setItemCategory] = useState<ShopItem["category"]>("reward");
  const [itemSlot, setItemSlot] = useState<NonNullable<ShopItem["slot"]>>("accessory");
  const [itemRarity, setItemRarity] = useState<ShopItem["rarity"]>("common");
  const [itemDescription, setItemDescription] = useState("");

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
  }), [safeShopItems, inventoryCategory, inventoryStatus]);

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
        eyebrow="Личный центр"
        title={activeTab === "profile" ? "Мой профиль" : "Инвентарь"}
        description={activeTab === "profile" ? "Персонаж и всё важное о сегодняшнем дне — в одном месте." : "Купленные награды, доступные предметы и вся ваша коллекция."}
        actions={<div className="profile-balance"><span>Баланс</span><CoinDisplay amount={coins} size="lg" /></div>}
      />

      <nav className="profile-page-tabs" aria-label="Разделы профиля">
        <button type="button" className={activeTab === "profile" ? "is-active" : ""} onClick={() => setActiveTab("profile")}><UserRound className="size-4" /> Профиль</button>
        <button type="button" className={activeTab === "inventory" ? "is-active" : ""} onClick={() => setActiveTab("inventory")}><Package className="size-4" /> Инвентарь <span>{purchasedCount}</span></button>
      </nav>

      {activeTab === "profile" ? (
        <>
          <section className="profile-avatar-hero app-surface">
            <span className="profile-avatar-glow is-one" />
            <span className="profile-avatar-glow is-two" />
            <div className="profile-avatar-frame"><img src="/profile-avatar.png" alt="Мой 2D-персонаж" /></div>
            <div className="profile-avatar-copy">
              <span className="profile-avatar-kicker"><Sparkles className="size-4" /> Мой цифровой персонаж</span>
              <h2>Это твой день.<br />Собери его по-своему.</h2>
              <p>Здесь видно состояние, энергию, сон, питание, полезное время и финансовый прогресс.</p>
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
          <BalanceWheelCard />
        </>
      ) : (
        <section className="profile-inventory-page">
          <div className="profile-section-head">
            <div><p className="page-eyebrow">Моя коллекция</p><h2>Предметы и награды</h2></div>
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
