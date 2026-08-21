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
    name: "Красная футболка",
    emoji: "👕",
    price: 20,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.redTshirt,
    avatarPath: "/avatar-world/denis-red-shirt.png",
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Классическая красная футболка из оригинальной коллекции.",
  },
  {
    id: "cloth-blue-tshirt",
    name: "Синяя футболка",
    emoji: "👕",
    price: 20,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.blueTshirt,
    avatarPath: "/avatar-world/denis-blue-shirt.png",
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Классическая синяя футболка из оригинальной коллекции.",
  },
  {
    id: "pet-robot-dog-classic",
    name: "Робо-пёс · Классик",
    emoji: "🤖",
    price: 1500,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/robot-dog-classic.svg",
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Первая модель робо-пса. Настоящий раритет!",
  },
  {
    id: "house-castle-classic",
    name: "Средневековый замок",
    emoji: "🏰",
    price: 5000,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: "/shop/castle.svg",
    createdAt: LEGACY_DATE,
    rarity: "legacy",
    description: "Древний замок, построенный до великого обновления.",
  },

  // --- NEW VARIATIONS (Added Today) ---
  // Robot Dog Variations
  {
    id: "pet-robot-dog-v1",
    name: "Робо-пёс · MK-1",
    emoji: "🤖",
    price: 600,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/robot-dog-mk1.svg",
    createdAt: TODAY_DATE,
    rarity: "common",
    version: "1.0",
    description: "Базовая модель нового поколения роботов-помощников.",
  },
  {
    id: "pet-robot-dog-v2",
    name: "Робо-пёс · MK-2",
    emoji: "🤖",
    price: 1200,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/robot-dog-mk2.svg",
    createdAt: TODAY_DATE,
    rarity: "rare",
    version: "2.0",
    description: "Улучшенная модель с более прочным корпусом и новыми датчиками.",
  },
  {
    id: "pet-robot-dog-v3",
    name: "Робо-пёс · Прайм",
    emoji: "🤖",
    price: 3000,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/robot-dog-prime.svg",
    createdAt: TODAY_DATE,
    rarity: "epic",
    version: "Prime",
    description: "Премиальный робот-пес с уникальным дизайном и ИИ.",
  },
  {
    id: "pet-robot-dog-v4",
    name: "Робо-пёс · Зенит",
    emoji: "🤖",
    price: 7500,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/robot-dog-zenith.svg",
    createdAt: TODAY_DATE,
    rarity: "legendary",
    version: "Zenith",
    description: "Вершина инженерной мысли. Легендарный защитник вашего дома.",
  },

  // Galaxy Cat Variations
  {
    id: "pet-galaxy-cat-v1",
    name: "Звёздный кот",
    emoji: "🐱",
    price: 800,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/galaxy-cat-starry.svg",
    createdAt: TODAY_DATE,
    rarity: "common",
    description: "Котенок, который любит смотреть на звезды.",
  },
  {
    id: "pet-galaxy-cat-v2",
    name: "Кот Туманность",
    emoji: "🐱",
    price: 1800,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/galaxy-cat-nebula.svg",
    createdAt: TODAY_DATE,
    rarity: "rare",
    description: "Кот, чья шерсть переливается цветами туманности.",
  },
  {
    id: "pet-galaxy-cat-v3",
    name: "Галактический кот",
    emoji: "🌌",
    price: 4500,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/galaxy-cat-galaxy.svg",
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Кот, внутри которого живет целая галактика.",
  },
  {
    id: "pet-galaxy-cat-v4",
    name: "Повелитель Вселенной",
    emoji: "👑",
    price: 12000,
    category: "pets",
    slot: "pet",
    folder: "default",
    purchased: false,
    assetPath: "/shop/galaxy-cat-overlord.svg",
    createdAt: TODAY_DATE,
    rarity: "legendary",
    description: "Повелитель пространства и времени в обличии кота.",
  },

  // Clothing Variations
  {
    id: "cloth-cyber-suit-v1",
    name: "Кибержилет",
    emoji: "🦺",
    price: 150,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: "/shop/cyber-vest.svg",
    avatarPath: "/avatar-world/denis-cyber-vest.png",
    createdAt: TODAY_DATE,
    rarity: "rare",
    description: "Кибернетический жилет для начинающих хакеров.",
  },
  {
    id: "cloth-cyber-suit-v2",
    name: "Экзоскелет",
    emoji: "🦾",
    price: 800,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: "/shop/exo-skeleton.svg",
    avatarPath: "/avatar-world/denis-exoskeleton.png",
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Полноценный экзоскелет, увеличивающий силу и стиль.",
  },
  {
    id: "cloth-cyber-suit-v3",
    name: "Броня God-Speed",
    emoji: "⚡",
    price: 5000,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: "/shop/godspeed-armor.svg",
    avatarPath: "/avatar-world/denis-godspeed.png",
    createdAt: TODAY_DATE,
    rarity: "legendary",
    description: "Броня, позволяющая двигаться быстрее света. Почти.",
  },

  // New rendered costumes and separate wardrobe slots
  {
    id: "costume-urban-explorer-v1",
    name: "Городской исследователь",
    emoji: "🧥",
    price: 320,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    avatarPath: "/avatar-world/denis-urban-explorer-v1.png",
    createdAt: TODAY_DATE,
    rarity: "rare",
    version: "1.0",
    description: "Оливковая куртка, светлая футболка и фактурные карго — спокойный городской комплект.",
  },
  {
    id: "costume-midnight-tailored-v1",
    name: "Полуночный костюм",
    emoji: "🤵",
    price: 950,
    category: "costume",
    slot: "body",
    folder: "default",
    purchased: false,
    avatarPath: "/avatar-world/denis-midnight-suit-v1.png",
    createdAt: TODAY_DATE,
    rarity: "epic",
    version: "1.0",
    description: "Тёмно-синий пиджак, тонкая водолазка и мягкая шерстяная фактура.",
  },
  {
    id: "pants-sand-cargo-v1",
    name: "Песочные карго",
    emoji: "👖",
    price: 120,
    category: "pants",
    slot: "feet",
    folder: "default",
    purchased: false,
    avatarPath: "/avatar-world/denis-sand-cargo-v1.png",
    createdAt: TODAY_DATE,
    rarity: "common",
    version: "1.0",
    description: "Свободные хлопковые карго песочного цвета с карманами и естественными складками.",
  },
  {
    id: "pants-blue-denim-v1",
    name: "Свободный деним",
    emoji: "👖",
    price: 220,
    category: "pants",
    slot: "feet",
    folder: "default",
    purchased: false,
    avatarPath: "/avatar-world/denis-blue-jeans-v1.png",
    createdAt: TODAY_DATE,
    rarity: "rare",
    version: "1.0",
    description: "Прямые синие джинсы с заметной текстурой денима и аккуратной прострочкой.",
  },
  {
    id: "head-black-cap-v1",
    name: "Чёрная кепка",
    emoji: "🧢",
    price: 90,
    category: "headwear",
    slot: "head",
    folder: "default",
    purchased: false,
    avatarPath: "/avatar-world/denis-black-cap-v1.png",
    createdAt: TODAY_DATE,
    rarity: "common",
    version: "1.0",
    description: "Матовая чёрная кепка с фактурной тканью и мягким изогнутым козырьком.",
  },

  // Other previous items moved to legacy/new
  {
    id: "house-modern-villa",
    name: "Современная вилла",
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
    name: "Суперкар",
    emoji: "🏎️",
    price: 3000,
    category: "reward",
    slot: "vehicle",
    folder: "default",
    purchased: false,
    assetPath: "/shop/supercar.png",
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Очень быстрая и очень дорогая машина.",
  },
  {
    id: "house-cozy-cottage",
    name: "Уютный коттедж",
    emoji: "🏡",
    price: 1200,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: "/shop/cozy_cottage.png",
    createdAt: TODAY_DATE,
    rarity: "common",
    description: "Уютный домик для спокойной жизни.",
  },
  {
    id: "house-cyberpunk-apartment",
    name: "Киберпанк-квартира",
    emoji: "🏙️",
    price: 3500,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: "/shop/cyberpunk_apartment.png",
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Неоновые огни и вид на киберпанк-мегаполис.",
  },
  {
    id: "trans-helicopter",
    name: "Личный вертолёт",
    emoji: "🚁",
    price: 4200,
    category: "reward",
    slot: "vehicle",
    folder: "default",
    purchased: false,
    assetPath: "/shop/helicopter.png",
    createdAt: TODAY_DATE,
    rarity: "epic",
    description: "Личный вертолет для эффектных перемещений.",
  },
];
