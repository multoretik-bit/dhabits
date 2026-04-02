import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, ShoppingCart, FolderPlus, Package, User, Home, Car, Star, Clock, Info } from "lucide-react";
import { useApp, ShopItem, ShopFolder, getTodayDateString } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput, FormSelect, FormTextArea } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import CharacterDisplay from "@/components/CharacterDisplay";
import CoinDisplay from "@/components/CoinDisplay";
import { RarityBadge } from "@/components/RarityBadge";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";

const ITEM_CATEGORIES = [
  { value: "reward", label: "Награды" },
  { value: "clothing", label: "Одежда" },
  { value: "pets", label: "Питомцы" },
  { value: "background", label: "Дома" },
  { value: "vehicle", label: "Транспорт" },
];

const ITEM_SLOTS = [
  { value: "head", label: "Голова" },
  { value: "body", label: "Тело" },
  { value: "hands", label: "Руки" },
  { value: "feet", label: "Ноги" },
  { value: "accessory", label: "Аксессуар" },
  { value: "background", label: "Фон" },
  { value: "vehicle", label: "Транспорт" },
];

function getCategoryIcon(category: string) {
  switch (category) {
    case "reward": return <Star className="w-4 h-4 text-yellow-500" />;
    case "clothing": return <User className="w-4 h-4 text-blue-400" />;
    case "pets": return <span className="text-sm">🐾</span>;
    case "background": return <Home className="w-4 h-4 text-green-400" />;
    case "vehicle": return <Car className="w-4 h-4 text-purple-400" />;
    default: return <ShoppingCart className="w-4 h-4 text-slate-400" />;
  }
}

export default function ShopPage() {
  const {
    coins, shopItems, shopFolders, characterState,
    addShopItem, updateShopItem, deleteShopItem, purchaseItem,
    addShopFolder, equipItem, unequipItem,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"shop" | "inventory" | "character">("shop");
  const [activeCategory, setActiveCategory] = useState<"all" | "reward" | "clothing" | "background" | "vehicle" | "pets" | "character">("all");
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Item form state
  const [itemName, setItemName] = useState("");
  const [itemEmoji, setItemEmoji] = useState("🎁");
  const [itemPrice, setItemPrice] = useState("50");
  const [itemCategory, setItemCategory] = useState<"reward" | "clothing" | "background" | "vehicle" | "pets" | "character">("reward");
  const [itemSlot, setItemSlot] = useState("head");
  const [itemFolder, setItemFolder] = useState("default");
  const [itemRarity, setItemRarity] = useState<"common" | "rare" | "epic" | "legendary" | "legacy">("common");
  const [itemDescription, setItemDescription] = useState("");
  
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // Inventory filter/sort state
  const [invCategory, setInvCategory] = useState<string>("all");
  const [invRarity, setInvRarity] = useState<string>("all");
  const [invSort, setInvSort] = useState<string>("newest");

  // Folder form state
  const [folderName, setFolderName] = useState("");

  const resetItemForm = () => {
    setItemName(""); setItemEmoji("🎁"); setItemPrice("50");
    setItemCategory("reward"); setItemSlot("head"); setItemFolder("default");
    setItemRarity("common"); setItemDescription("");
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim()) {
      addShopItem({
        id: nanoid(), name: itemName, emoji: itemEmoji,
        price: parseFloat(itemPrice) || 50, category: itemCategory,
        slot: itemSlot as any, folder: itemFolder, purchased: false,
        createdAt: new Date().toISOString(),
        rarity: itemRarity,
        description: itemDescription,
      });
      resetItemForm(); setShowCreateItem(false);
    }
  };

  const handleOpenEditItem = (item: ShopItem) => {
    setEditingItemId(item.id); setItemName(item.name); setItemEmoji(item.emoji);
    setItemPrice(String(item.price)); setItemCategory(item.category);
    setItemSlot(item.slot || "head"); setItemFolder(item.folder);
    setItemRarity(item.rarity || "common"); setItemDescription(item.description || "");
    setShowEditItem(true);
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItemId && itemName.trim()) {
      updateShopItem(editingItemId, {
        name: itemName, emoji: itemEmoji, price: parseFloat(itemPrice) || 50,
        category: itemCategory, slot: itemSlot as any, folder: itemFolder,
        rarity: itemRarity, description: itemDescription,
      });
      setShowEditItem(false); setEditingItemId(null); resetItemForm();
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Удалить предмет?")) deleteShopItem(id);
  };

  const handlePurchaseItem = (id: string) => {
    const success = purchaseItem(id);
    if (!success) alert("Недостаточно монет!");
    else if (selectedItem) setSelectedItem(null); 
  };

  const handleEquipItem = (itemId: string) => equipItem(itemId);
  const handleUnequipSlot = (slot: string) => unequipItem(slot as any);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      addShopFolder({ id: nanoid(), name: folderName, collapsed: false });
      setFolderName(""); setShowCreateFolder(false);
    }
  };

  const availableItems = shopItems.filter(i => !i.purchased && (activeCategory === "all" || i.category === activeCategory));
  
  const filteredPurchasedItems = shopItems
    .filter(i => i.purchased)
    .filter(i => invCategory === "all" || i.category === invCategory)
    .filter(i => invRarity === "all" || i.rarity === invRarity)
    .sort((a, b) => {
      if (invSort === "price-asc") return a.price - b.price;
      if (invSort === "price-desc") return b.price - a.price;
      if (invSort === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (invSort === "oldest") return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      return 0;
    });

  const ItemForm = () => (
    <>
      <FormInput label="Название предмета" value={itemName} onChange={setItemName} />
      <EmojiPicker label="Эмодзи" value={itemEmoji} onChange={setItemEmoji} />
      <FormInput label="Цена (монеты)" value={itemPrice} onChange={setItemPrice} type="number" />
      <FormSelect label="Категория" value={itemCategory} onChange={(v) => setItemCategory(v as any)} options={ITEM_CATEGORIES} />
      {itemCategory === "clothing" && <FormSelect label="Слот" value={itemSlot} onChange={setItemSlot} options={ITEM_SLOTS} />}
      <FormSelect label="Редкость" value={itemRarity} onChange={(v) => setItemRarity(v as any)} options={[
        { value: "common", label: "Обычный" },
        { value: "rare", label: "Редкий" },
        { value: "epic", label: "Эпический" },
        { value: "legendary", label: "Легендарный" },
        { value: "legacy", label: "Раритет (Legacy)" },
      ]} />
      <FormTextArea label="Описание" value={itemDescription} onChange={setItemDescription} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Папка</label>
        <select value={itemFolder} onChange={(e) => setItemFolder(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          <option value="default">Default</option>
          {shopFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
    </>
  );

  const rarityColors = {
    common: "border-slate-800/80 shadow-sm",
    rare: "border-blue-900/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    epic: "border-purple-900/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    legendary: "border-orange-900/50 shadow-[0_0_25px_rgba(249,115,22,0.2)]",
    legacy: "border-amber-900/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
  };

  return (
    <div className="px-5 pt-8 pb-4 min-h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Магазин</h2>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/50 shadow-sm flex items-center">
            <CoinDisplay amount={coins} size="md" showLabel={true} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-900/50 rounded-2xl p-1.5 mb-6 border border-slate-800/80 shadow-inner overflow-x-auto no-scrollbar">
        {[
          { id: "shop", label: "Магазин", icon: <ShoppingCart className="w-4 h-4" /> },
          { id: "inventory", label: "Инвентарь", icon: <Package className="w-4 h-4" /> },
          { id: "character", label: "Персонаж", icon: <User className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap
              ${activeTab === t.id ? "bg-blue-600 text-white shadow-md shadow-blue-900/50" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* SHOP TAB */}
      {activeTab === "shop" && (
        <div className="space-y-5">
          {/* Admin Tools - optional to be visible all the time, but user had it */}
          <div className="flex gap-2 mb-2">
            <Button onClick={() => setShowCreateFolder(true)} variant="outline" size="sm" className="bg-slate-900/50 border-slate-800 text-slate-300">
               <FolderPlus className="w-4 h-4 mr-1" /> Папка
            </Button>
            <Button onClick={() => setShowCreateItem(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
               <Plus className="w-4 h-4 mr-1" /> Добавить
            </Button>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {[ { value: "all", label: "Все" }, ...ITEM_CATEGORIES ].map(cat => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                  activeCategory === cat.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {availableItems.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500">
              В этой категории нет предметов
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableItems.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={`item-${item.id}`}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-slate-900/60 border rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden group hover:border-slate-600/50 transition-all shadow-sm cursor-pointer active:scale-95
                    ${rarityColors[item.rarity || "common"]}`}
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenEditItem(item)} className="text-blue-400 p-1"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  <div className="flex items-center gap-1.5 absolute top-3 left-3 z-10">
                    {getCategoryIcon(item.category)}
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <RarityBadge rarity={item.rarity || "common"} showIcon={false} className="opacity-80 scale-75 origin-bottom-right" />
                  </div>
                  
                  {item.assetPath && item.assetPath.endsWith('.png') ? (
                    <img src={item.assetPath} alt={item.name} className="w-20 h-20 object-contain mt-4 mb-2 filter drop-shadow-md" />
                  ) : (
                    <div className="text-5xl mt-4 mb-2 filter drop-shadow-md">{item.emoji}</div>
                  )}
                  <div className="text-center w-full">
                    <h3 className="font-bold text-slate-200 text-sm mb-0.5 leading-tight">{item.name}</h3>
                    {item.slot && <p className="text-[10px] text-slate-500 uppercase tracking-widest">{ITEM_SLOTS.find(s=>s.value===item.slot)?.label}</p>}
                  </div>

                  <div className="w-full flex items-center justify-center gap-1 text-slate-400 font-bold text-xs mt-1">
                     <img src="/coin.png" alt="coin" className="w-3 h-3 object-contain" /> {item.price}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-6">
          {/* Inventory Controls */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-5 space-y-4 shadow-sm backdrop-blur-sm">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Категория</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {[ { value: "all", label: "Все" }, ...ITEM_CATEGORIES ].map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setInvCategory(cat.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                      invCategory === cat.value
                        ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/30"
                        : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:bg-slate-700/50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rarity Filter */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Редкость</label>
                <select 
                  value={invRarity} 
                  onChange={(e) => setInvRarity(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all">Любая</option>
                  <option value="common">Обычный</option>
                  <option value="rare">Редкий</option>
                  <option value="epic">Эпический</option>
                  <option value="legendary">Легендарный</option>
                  <option value="legacy">Раритет</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Сортировка</label>
                <select 
                  value={invSort} 
                  onChange={(e) => setInvSort(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="newest">Сначала новые</option>
                  <option value="oldest">Сначала старые</option>
                  <option value="price-asc">Дешевле</option>
                  <option value="price-desc">Дороже</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <p className="text-slate-400 text-xs font-bold">Найдено: {filteredPurchasedItems.length}</p>
          </div>

          {filteredPurchasedItems.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-[32px] p-12 text-center">
              <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                <Package className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Ничего не найдено с такими фильтрами</p>
              <button 
                onClick={() => { setInvCategory("all"); setInvRarity("all"); }}
                className="mt-4 text-blue-400 text-xs font-bold hover:underline"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredPurchasedItems.map((item) => {
                const isEquipped = item.slot && characterState[item.slot as keyof typeof characterState] === item.id;
                return (
                  <motion.div 
                    layoutId={`item-${item.id}`}
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className={`bg-slate-900/60 border rounded-2xl p-4 flex flex-col items-center gap-3 relative shadow-sm transition-all cursor-pointer hover:border-slate-600/50 active:scale-95
                      ${isEquipped ? "border-blue-500/50 bg-blue-950/20" : "border-slate-800/80"} ${rarityColors[item.rarity || "common"]}`}
                  >
                    {isEquipped && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg tracking-wider uppercase z-10">Надето</div>}
                    
                    <div className="absolute top-3 left-3 opacity-60 scale-75 origin-top-left z-10">
                      <RarityBadge rarity={item.rarity || "common"} showIcon={false} />
                    </div>

                    {item.assetPath && item.assetPath.endsWith('.png') ? (
                      <img src={item.assetPath} alt={item.name} className="w-20 h-20 object-contain my-2 filter drop-shadow-md" />
                    ) : (
                      <div className="text-5xl my-2 filter drop-shadow-md">{item.emoji}</div>
                    )}
                    <div className="text-center w-full">
                      <h3 className="font-bold text-slate-200 text-sm leading-tight">{item.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{ITEM_CATEGORIES.find(c=>c.value===item.category)?.label}</p>
                    </div>

                    {item.slot && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          isEquipped ? handleUnequipSlot(item.slot!) : handleEquipItem(item.id);
                        }}
                        variant={isEquipped ? "outline" : "default"}
                        className={`w-full mt-1 font-bold shadow-sm ${!isEquipped ? "bg-blue-600 text-white" : "border-blue-900 text-blue-400 hover:bg-slate-800"}`}
                      >
                        {isEquipped ? "Снять" : "Надеть"}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CHARACTER TAB */}
      {activeTab === "character" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-blue-950/60 to-slate-900 rounded-3xl border border-blue-900/40 p-6 flex flex-col items-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 w-full h-1/2 bg-blue-600/10 blur-[50px] pointer-events-none" />
            <h3 className="font-extrabold text-blue-100 text-lg mb-4 z-10">Ваш Персонаж</h3>
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/50 shadow-inner z-10">
              <CharacterDisplay width={120} height={180} />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-200 text-lg">Надето сейчас</h3>
            {Object.entries(characterState).length === 0 ? (
               <p className="text-slate-500 text-sm">На персонаже нет предметов.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(characterState).map(([slot, itemId]) => {
                  const item = shopItems.find((i) => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={slot} className="flex items-center justify-between p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl filter drop-shadow-sm">{item.emoji}</span>
                        <div>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{ITEM_SLOTS.find(s=>s.value===slot)?.label}</p>
                          <p className="text-sm font-bold text-slate-200">{item.name}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleUnequipSlot(slot)} className="text-red-400 hover:bg-red-400/10 hover:text-red-300">
                        Снять
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              layoutId={`item-${selectedItem.id}`}
              className={`w-full max-w-md bg-slate-900 border rounded-[32px] p-8 shadow-2xl relative overflow-hidden z-10 ${rarityColors[selectedItem.rarity || "common"]}`}
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-40 blur-[80px] opacity-20 pointer-events-none" style={{ background: selectedItem.rarity === 'legendary' ? 'orange' : selectedItem.rarity === 'epic' ? 'purple' : 'blue' }} />

              <div className="flex flex-col items-center text-center">
                <RarityBadge rarity={selectedItem.rarity || "common"} className="mb-6 scale-110" />
                
                <div className="relative mb-8">
                  {selectedItem.assetPath && selectedItem.assetPath.endsWith('.png') ? (
                    <img src={selectedItem.assetPath} alt={selectedItem.name} className="w-40 h-40 object-contain filter drop-shadow-2xl" />
                  ) : (
                    <div className="text-8xl filter drop-shadow-2xl">{selectedItem.emoji}</div>
                  )}
                  {selectedItem.version && (
                    <div className="absolute -bottom-2 -right-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      v{selectedItem.version}
                    </div>
                  )}
                </div>

                <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{selectedItem.name}</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-[280px]">
                  {selectedItem.description || "Уникальный предмет из вашей коллекции."}
                </p>

                <div className="w-full grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                      <Clock className="w-3 h-3" /> Дата релиза
                    </div>
                    <p className="text-sm font-bold text-slate-200">
                      {new Date(selectedItem.createdAt || "").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
                      <Package className="w-3 h-3" /> Категория
                    </div>
                    <p className="text-sm font-bold text-slate-200">
                      {ITEM_CATEGORIES.find(c => c.value === selectedItem.category)?.label}
                    </p>
                  </div>
                </div>

                {selectedItem.purchased ? (
                  <div className="w-full flex gap-3">
                    <Button
                      className="flex-1 rounded-2xl h-14 font-black transition-all bg-slate-800 text-slate-400"
                      onClick={() => setSelectedItem(null)}
                    >
                      Закрыть
                    </Button>
                    {selectedItem.slot && (
                      <Button
                        className={`flex-1 rounded-2xl h-14 font-black transition-all ${
                          characterState[selectedItem.slot as keyof typeof characterState] === selectedItem.id
                            ? "bg-red-600/20 text-red-400 border border-red-500/30"
                            : "bg-blue-600 text-white"
                        }`}
                        onClick={() => {
                          const isEquipped = characterState[selectedItem.slot as keyof typeof characterState] === selectedItem.id;
                          isEquipped ? handleUnequipSlot(selectedItem.slot!) : handleEquipItem(selectedItem.id);
                        }}
                      >
                        {characterState[selectedItem.slot as keyof typeof characterState] === selectedItem.id ? "Снять" : "Надеть"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    disabled={coins < selectedItem.price}
                    onClick={() => handlePurchaseItem(selectedItem.id)}
                    className={`w-full h-14 rounded-2xl font-black text-lg gap-3 transition-all
                      ${coins >= selectedItem.price 
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:scale-105 shadow-xl shadow-blue-900/40" 
                        : "bg-slate-800 text-slate-500"}`}
                  >
                    <img src="/coin.png" alt="coin" className="w-6 h-6 object-contain" />
                    <span>Купить за {selectedItem.price}</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <FormModal title="Добавить предмет" isOpen={showCreateItem} onClose={() => { setShowCreateItem(false); resetItemForm(); }} onSubmit={handleCreateItem} submitText="Добавить"><ItemForm /></FormModal>
      <FormModal title="Изменить предмет" isOpen={showEditItem} onClose={() => { setShowEditItem(false); setEditingItemId(null); resetItemForm(); }} onSubmit={handleEditItem} submitText="Сохранить"><ItemForm /></FormModal>
      <FormModal title="Новая папка" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={handleCreateFolder} submitText="Создать"><FormInput label="Название папки" value={folderName} onChange={setFolderName} /></FormModal>
    </div>
  );
}
