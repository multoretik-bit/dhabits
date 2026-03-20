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

export const defaultShopItems: ShopItem[] = [
  {
    id: "default-red-tshirt",
    name: "Red T-Shirt",
    emoji: "👕",
    price: 20,
    category: "character",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.redTshirt,
  },
  {
    id: "default-blue-tshirt",
    name: "Blue T-Shirt",
    emoji: "👕",
    price: 20,
    category: "character",
    slot: "body",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.blueTshirt,
  },
  {
    id: "default-black-pants",
    name: "Black Pants",
    emoji: "👖",
    price: 25,
    category: "character",
    slot: "hands",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.blackPants,
  },
  {
    id: "default-blue-pants",
    name: "Blue Pants",
    emoji: "👖",
    price: 25,
    category: "character",
    slot: "hands",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.bluePants,
  },
  {
    id: "default-red-cap",
    name: "Red Cap",
    emoji: "🧢",
    price: 15,
    category: "character",
    slot: "head",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.redCap,
  },
  {
    id: "default-black-cap",
    name: "Black Cap",
    emoji: "🧢",
    price: 15,
    category: "character",
    slot: "head",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.blackCap,
  },
  {
    id: "default-red-sneakers",
    name: "Red Sneakers",
    emoji: "👟",
    price: 18,
    category: "character",
    slot: "feet",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.redShoes,
  },
  {
    id: "default-white-sneakers",
    name: "White Sneakers",
    emoji: "👟",
    price: 18,
    category: "character",
    slot: "feet",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.whiteShoes,
  },
  {
    id: "default-sunglasses",
    name: "Sunglasses",
    emoji: "😎",
    price: 12,
    category: "character",
    slot: "accessory",
    folder: "default",
    purchased: false,
    assetPath: clothingSVGs.glasses,
  },
  {
    id: "default-small-house",
    name: "Small House",
    emoji: "🏠",
    price: 50,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: backgroundSVGs.smallHouse,
  },
  {
    id: "default-big-house",
    name: "Big House",
    emoji: "🏡",
    price: 100,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: backgroundSVGs.bigHouse,
  },
  {
    id: "default-apartment",
    name: "Apartment",
    emoji: "🏢",
    price: 150,
    category: "background",
    slot: "background",
    folder: "default",
    purchased: false,
    assetPath: backgroundSVGs.apartment,
  },
  {
    id: "default-sports-car",
    name: "Sports Car",
    emoji: "🏎️",
    price: 80,
    category: "vehicle",
    slot: "vehicle",
    folder: "default",
    purchased: false,
    assetPath: vehicleSVGs.sportsCar,
  },
  {
    id: "default-suv",
    name: "SUV",
    emoji: "🚙",
    price: 70,
    category: "vehicle",
    slot: "vehicle",
    folder: "default",
    purchased: false,
    assetPath: vehicleSVGs.suv,
  },
  {
    id: "default-motorcycle",
    name: "Motorcycle",
    emoji: "🏍️",
    price: 60,
    category: "vehicle",
    slot: "vehicle",
    folder: "default",
    purchased: false,
    assetPath: vehicleSVGs.motorcycle,
  },
];
