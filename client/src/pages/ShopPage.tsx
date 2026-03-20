import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, ShoppingCart, FolderPlus, Package, User, Home, Car, Star } from "lucide-react";
import { useApp, ShopItem, ShopFolder } from "@/contexts/AppContext";
import FormModal from "@/components/FormModal";
import { FormInput, FormSelect } from "@/components/FormInputs";
import EmojiPicker from "@/components/EmojiPicker";
import CharacterDisplay from "@/components/CharacterDisplay";
import CoinDisplay from "@/components/CoinDisplay";
import { nanoid } from "nanoid";

const ITEM_CATEGORIES = [
  { value: "reward", label: "Награды" },
  { value: "character", label: "Персонаж" },
  { value: "background", label: "Фон" },
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
    case "character": return <User className="w-4 h-4 text-blue-400" />;
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
  const [activeCategory, setActiveCategory] = useState<"all" | "reward" | "character" | "background" | "vehicle">("all");
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Item form state
  const [itemName, setItemName] = useState("");
  const [itemEmoji, setItemEmoji] = useState("🎁");
  const [itemPrice, setItemPrice] = useState("50");
  const [itemCategory, setItemCategory] = useState<"reward" | "character" | "background" | "vehicle">("reward");
  const [itemSlot, setItemSlot] = useState("head");
  const [itemFolder, setItemFolder] = useState("default");
  
  // Folder form state
  const [folderName, setFolderName] = useState("");

  const resetItemForm = () => {
    setItemName(""); setItemEmoji("🎁"); setItemPrice("50");
    setItemCategory("reward"); setItemSlot("head"); setItemFolder("default");
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim()) {
      addShopItem({
        id: nanoid(), name: itemName, emoji: itemEmoji,
        price: parseFloat(itemPrice) || 50, category: itemCategory,
        slot: itemSlot as any, folder: itemFolder, purchased: false,
      });
      resetItemForm(); setShowCreateItem(false);
    }
  };

  const handleOpenEditItem = (item: ShopItem) => {
    setEditingItemId(item.id); setItemName(item.name); setItemEmoji(item.emoji);
    setItemPrice(String(item.price)); setItemCategory(item.category);
    setItemSlot(item.slot || "head"); setItemFolder(item.folder);
    setShowEditItem(true);
  };

  const handleEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItemId && itemName.trim()) {
      updateShopItem(editingItemId, {
        name: itemName, emoji: itemEmoji, price: parseFloat(itemPrice) || 50,
        category: itemCategory, slot: itemSlot as any, folder: itemFolder,
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
  const purchasedItems = shopItems.filter(i => i.purchased);

  const ItemForm = () => (
    <>
      <FormInput label="Название предмета" value={itemName} onChange={setItemName} />
      <EmojiPicker label="Эмодзи" value={itemEmoji} onChange={setItemEmoji} />
      <FormInput label="Цена (монеты)" value={itemPrice} onChange={setItemPrice} type="number" />
      <FormSelect label="Категория" value={itemCategory} onChange={(v) => setItemCategory(v as any)} options={ITEM_CATEGORIES} />
      {itemCategory === "character" && <FormSelect label="Слот" value={itemSlot} onChange={setItemSlot} options={ITEM_SLOTS} />}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Папка</label>
        <select value={itemFolder} onChange={(e) => setItemFolder(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500">
          <option value="default">Default</option>
          {shopFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
    </>
  );

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
            {[ { id: "all", label: "Все" }, ...ITEM_CATEGORIES ].map(cat => (
              <button
                key={cat.id || cat.value}
                onClick={() => setActiveCategory((cat.id || cat.value) as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                  activeCategory === (cat.id || cat.value)
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
                <div key={item.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden group hover:border-blue-900/50 transition-colors shadow-sm">
                  {/* Absolute admin actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEditItem(item)} className="text-blue-400 p-1"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                  </div>

                  <div className="flex items-center gap-1.5 absolute top-3 left-3">
                    {getCategoryIcon(item.category)}
                  </div>
                  
                  <div className="text-5xl mt-4 mb-2 filter drop-shadow-md">{item.emoji}</div>
                  <div className="text-center w-full">
                    <h3 className="font-bold text-slate-200 text-sm mb-0.5 leading-tight">{item.name}</h3>
                    {item.slot && <p className="text-[10px] text-slate-500 uppercase tracking-widest">{ITEM_SLOTS.find(s=>s.value===item.slot)?.label}</p>}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handlePurchaseItem(item.id)}
                    disabled={coins < item.price}
                    className={`w-full gap-1.5 font-bold mt-1 shadow-sm ${coins >= item.price ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400" : "bg-slate-800 text-slate-500"}`}
                  >
                    <span>💰</span> {item.price}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm font-medium">Куплено предметов: {purchasedItems.length}</p>
          {purchasedItems.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500">
              Ваш инвентарь пуст. Загляните в магазин!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {purchasedItems.map((item) => {
                const isEquipped = item.slot && characterState[item.slot as keyof typeof characterState] === item.id;
                return (
                  <div key={item.id} className={`bg-slate-900/60 border rounded-2xl p-4 flex flex-col items-center gap-3 relative shadow-sm transition-colors ${isEquipped ? "border-blue-500/50 bg-blue-950/20" : "border-slate-800/80"}`}>
                    {isEquipped && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg tracking-wider uppercase">Надето</div>}
                    
                    <div className="text-5xl my-2 filter drop-shadow-md">{item.emoji}</div>
                    <div className="text-center w-full">
                      <h3 className="font-bold text-slate-200 text-sm leading-tight">{item.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{ITEM_CATEGORIES.find(c=>c.value===item.category)?.label}</p>
                    </div>

                    {item.category === "character" && item.slot && (
                      <Button
                        size="sm"
                        onClick={() => isEquipped ? handleUnequipSlot(item.slot!) : handleEquipItem(item.id)}
                        variant={isEquipped ? "outline" : "default"}
                        className={`w-full mt-1 font-bold shadow-sm ${!isEquipped ? "bg-blue-600 text-white" : "border-blue-900 text-blue-400 hover:bg-slate-800"}`}
                      >
                        {isEquipped ? "Снять" : "Надеть"}
                      </Button>
                    )}
                  </div>
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
      <FormModal title="Добавить предмет" isOpen={showCreateItem} onClose={() => { setShowCreateItem(false); resetItemForm(); }} onSubmit={handleCreateItem} submitText="Добавить"><ItemForm /></FormModal>
      <FormModal title="Изменить предмет" isOpen={showEditItem} onClose={() => { setShowEditItem(false); setEditingItemId(null); resetItemForm(); }} onSubmit={handleEditItem} submitText="Сохранить"><ItemForm /></FormModal>
      <FormModal title="Новая папка" isOpen={showCreateFolder} onClose={() => { setShowCreateFolder(false); setFolderName(""); }} onSubmit={handleCreateFolder} submitText="Создать"><FormInput label="Название папки" value={folderName} onChange={setFolderName} /></FormModal>
    </div>
  );
}
