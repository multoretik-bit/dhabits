import type { ShopItem } from "@/contexts/AppContext";

const clothingSVGs = {
  redTshirt: `<rect x="30" y="45" width="40" height="50" fill="#FF0000" rx="2"/>
             <rect x="20" y="45" width="15" height="30" fill="#FF0000" rx="2" transform="rotate(-5 27 60)"/>
             <rect x="65" y="45" width="15" height="30" fill="#FF0000" rx="2" transform="rotate(5 72 60)"/>`,
  blueTshirt: `<rect x="30" y="45" width="40" height="50" fill="#0066FF" rx="2"/>
              <rect x="20" y="45" width="15" height="30" fill="#0066FF" rx="2" transform="rotate(-5 27 60)"/>
              <rect x="65" y="45" width="15" height="30" fill="#0066FF" rx="2" transform="rotate(5 72 60)"/>`,
  blackPants: `<rect x="35" y="95" width="15" height="50" fill="#222222" rx="2"/>
              <rect x="50" y="95" width="15" height="50" fill="#222222" rx="2"/>
              <rect x="35" y="95" width="30" height="10" fill="#333333"/>`,
  bluePants: `<rect x="35" y="95" width="15" height="50" fill="#1E40AF" rx="2"/>
             <rect x="50" y="95" width="15" height="50" fill="#1E40AF" rx="2"/>
             <rect x="35" y="95" width="30" height="10" fill="#2563EB"/>`,
  redCap: `<ellipse cx="50" cy="12" rx="22" ry="8" fill="#FF0000"/>
          <rect x="28" y="8" width="44" height="10" fill="#FF0000" rx="2"/>
          <rect x="28" y="14" width="50" height="4" fill="#CC0000" rx="1"/>`,
  blackCap: `<ellipse cx="50" cy="12" rx="22" ry="8" fill="#222222"/>
            <rect x="28" y="8" width="44" height="10" fill="#222222" rx="2"/>
            <rect x="28" y="14" width="50" height="4" fill="#111111" rx="1"/>`,
  redShoes: `<ellipse cx="40" cy="140" rx="12" ry="5" fill="#FF0000"/>
            <ellipse cx="62" cy="140" rx="12" ry="5" fill="#FF0000"/>`,
  whiteShoes: `<ellipse cx="40" cy="140" rx="12" ry="5" fill="#FFFFFF"/>
              <ellipse cx="62" cy="140" rx="12" ry="5" fill="#FFFFFF"/>`,
  glasses: `<circle cx="38" cy="28" r="8" fill="none" stroke="#FFD700" stroke-width="2"/>
           <circle cx="62" cy="28" r="8" fill="none" stroke="#FFD700" stroke-width="2"/>
           <line x1="46" y1="28" x2="54" y2="28" stroke="#FFD700" stroke-width="2"/>`,
};

const backgroundSVGs = {
  smallHouse: `<rect x="20" y="70" width="60" height="50" fill="#8B4513"/>
              <polygon points="50,40 20,70 80,70" fill="#CC4444"/>
              <rect x="40" y="90" width="20" height="30" fill="#4444CC"/>
              <rect x="25" y="75" width="12" height="12" fill="#87CEEB"/>
              <rect x="63" y="75" width="12" height="12" fill="#87CEEB"/>`,
  bigHouse: `<rect x="15" y="65" width="70" height="55" fill="#A0522D"/>
            <polygon points="50,35 15,65 85,65" fill="#8B0000"/>
            <rect x="38" y="85" width="24" height="35" fill="#2244AA"/>
            <rect x="18" y="70" width="14" height="14" fill="#87CEEB"/>
            <rect x="68" y="70" width="14" height="14" fill="#87CEEB"/>
            <rect x="18" y="90" width="14" height="14" fill="#87CEEB"/>
            <rect x="68" y="90" width="14" height="14" fill="#87CEEB"/>`,
  apartment: `<rect x="20" y="30" width="60" height="90" fill="#708090"/>
             <rect x="28" y="40" width="8" height="8" fill="#87CEEB"/>
             <rect x="40" y="40" width="8" height="8" fill="#87CEEB"/>
             <rect x="52" y="40" width="8" height="8" fill="#87CEEB"/>
             <rect x="64" y="40" width="8" height="8" fill="#87CEEB"/>
             <rect x="28" y="55" width="8" height="8" fill="#87CEEB"/>
             <rect x="40" y="55" width="8" height="8" fill="#87CEEB"/>
             <rect x="52" y="55" width="8" height="8" fill="#87CEEB"/>
             <rect x="64" y="55" width="8" height="8" fill="#87CEEB"/>
             <rect x="28" y="65" width="8" height="8" fill="#87CEEB"/>
             <rect x="40" y="65" width="8" height="8" fill="#87CEEB"/>
             <rect x="52" y="65" width="8" height="8" fill="#87CEEB"/>
             <rect x="28" y="80" width="8" height="8" fill="#87CEEB"/>
             <rect x="40" y="80" width="8" height="8" fill="#87CEEB"/>
             <rect x="52" y="80" width="8" height="8" fill="#87CEEB"/>`,
};

const vehicleSVGs = {
  sportsCar: `<ellipse cx="50" cy="110" rx="35" ry="12" fill="#FFD700"/>
             <rect x="30" y="105" width="40" height="8" fill="#FFD700" rx="2"/>
             <circle cx="35" cy="122" r="4" fill="#333333"/>
             <circle cx="65" cy="122" r="4" fill="#333333"/>
             <rect x="45" y="100" width="10" height="6" fill="#87CEEB"/>`,
  suv: `<rect x="25" y="105" width="50" height="15" fill="#228B22" rx="2"/>
       <rect x="30" y="100" width="40" height="6" fill="#228B22" rx="1"/>
       <circle cx="35" cy="120" r="5" fill="#333333"/>
       <circle cx="65" cy="120" r="5" fill="#333333"/>
       <rect x="50" y="102" width="8" height="5" fill="#87CEEB"/>`,
  motorcycle: `<circle cx="35" cy="120" r="6" fill="#333333"/>
               <circle cx="65" cy="120" r="6" fill="#333333"/>
               <rect x="40" y="105" width="20" height="12" fill="#DC143C" rx="2"/>
               <polygon points="50,100 55,95 50,98" fill="#DC143C"/>`,
};

const LEGACY_DATE = "2024-01-01T00:00:00Z";
const TODAY_DATE = new Date().toISOString();

export const defaultShopItems: ShopItem[] = [
  // --- LEGACY ITEMS (Before Update) ---
  {
    id: "cloth-red-tshirt",
    name: "Red T-Shirt",
    emoji: "👕",
    price: 20,
    category: "clothing",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.redTshirt,
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Классическая красная футболка из оригинальной коллекции.",
  },
  {
    id: "cloth-blue-tshirt",
    name: "Blue T-Shirt",
    emoji: "👕",
    price: 20,
    category: "clothing",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.blueTshirt,
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Классическая синяя футболка из оригинальной коллекции.",
  },
  {
    id: "pet-robot-dog-classic",
    name: "Robot Dog (Classic)",
    emoji: "🤖",
    price: 1500,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Первая модель робо-пса. Настоящий раритет!",
  },
  {
    id: "house-castle-classic",
    name: "Medieval Castle",
    emoji: "🏰",
    price: 5000,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Древний замок, построенный до великого обновления.",
  },

  // --- NEW VARIATIONS (Added Today) ---
  // Robot Dog Variations
  {
    id: "pet-robot-dog-v1",
    name: "Robot Dog MK-1",
    emoji: "🤖",
    price: 600,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "common",
    version: "1.0",
    description: "Базовая модель нового поколения роботов-помощников.",
  },
  {
    id: "pet-robot-dog-v2",
    name: "Robot Dog MK-2",
    emoji: "🤖",
    price: 1200,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "rare",
    version: "2.0",
    description: "Улучшенная модель с более прочным корпусом и новыми датчиками.",
  },
  {
    id: "pet-robot-dog-v3",
    name: "Robot Dog Prime",
    emoji: "🤖",
    price: 3000,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "epic",
    version: "Prime",
    description: "Премиальный робот-пес с уникальным дизайном и ИИ.",
  },
  {
    id: "pet-robot-dog-v4",
    name: "Robot Dog Zenith",
    emoji: "🤖",
    price: 7500,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "legendary",
    version: "Zenith",
    description: "Вершина инженерной мысли. Легендарный защитник вашего дома.",
  },

  // Galaxy Cat Variations
  {
    id: "pet-galaxy-cat-v1",
    name: "Starry Cat",
    emoji: "🐱",
    price: 800,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "common",
    description: "Котенок, который любит смотреть на звезды.",
  },
  {
    id: "pet-galaxy-cat-v2",
    name: "Nebula Cat",
    emoji: "🐱",
    price: 1800,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "rare",
    description: "Кот, чья шерсть переливается цветами туманности.",
  },
  {
    id: "pet-galaxy-cat-v3",
    name: "Galaxy Cat",
    emoji: "🌌",
    price: 4500,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Кот, внутри которого живет целая галактика.",
  },
  {
    id: "pet-galaxy-cat-v4",
    name: "Universal Overlord",
    emoji: "👑",
    price: 12000,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "legendary",
    description: "Повелитель пространства и времени в обличии кота.",
  },

  // Clothing Variations
  {
    id: "cloth-cyber-suit-v1",
    name: "Cyber Vest",
    emoji: "🦺",
    price: 150,
    category: "clothing",
    slot: "body",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "rare",
    description: "Кибернетический жилет для начинающих хакеров.",
  },
  {
    id: "cloth-cyber-suit-v2",
    name: "Exo-Skeleton",
    emoji: "🦾",
    price: 800,
    category: "clothing",
    slot: "body",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Полноценный экзоскелет, увеличивающий силу и стиль.",
  },
  {
    id: "cloth-cyber-suit-v3",
    name: "God-Speed Armor",
    emoji: "⚡",
    price: 5000,
    category: "clothing",
    slot: "body",
    folder: "default",
    purchased: false,
    createdAt: TODAY_DATE,
    rarity: "legendary",
    description: "Броня, позволяющая двигаться быстрее света. Почти.",
  },

  // Other previous items moved to legacy/new
  {
    id: "house-modern-villa",
    name: "Modern Villa",
    emoji: "🏘️",
    price: 2500,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: "/shop/modern_villa.png",
    createdAt: TODAY_DATE,
    rarity: "rare",
    description: "Современная вилла с панорамными окнами.",
  },
  {
    id: "trans-supercar",
    name: "Supercar",
    emoji: "🏎️",
    price: 3000,
    category: "vehicle",
    slot: "vehicle",
    folder: "default",
    purchased: false,
    assetPath: "/shop/supercar.png",
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Очень быстрая и очень дорогая машина.",
  },
];
