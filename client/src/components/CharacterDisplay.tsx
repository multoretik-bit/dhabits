import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useApp, ShopItem } from "@/contexts/AppContext";

interface CharacterDisplayProps {
  width?: number;
  height?: number;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ width = 150, height = 200 }) => {
  const { characterState, shopItems } = useApp();
  const reduceMotion = useReducedMotion();
  
  const renderItem = (item?: ShopItem, isPet?: boolean) => {
    if (!item) return null;
    
    // PNG Image support
    if (item.assetPath && item.assetPath.endsWith('.png')) {
      return (
        <image 
          href={item.assetPath} 
          x={isPet ? "-50" : "0"} y={isPet ? "-50" : "0"} 
          width={isPet ? "100" : "100"} height={isPet ? "100" : "150"} 
          preserveAspectRatio="xMidYMid meet"
        />
      );
    }
    
    // SVG Asset support
    if (item.assetPath) {
      return <g dangerouslySetInnerHTML={{ __html: item.assetPath }} />;
    }
    
    // Emoji Fallback
    return (
      <text 
        x={isPet ? "0" : "50"} 
        y={isPet ? "0" : "75"} 
        fontSize={isPet ? "45" : "25"} 
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        {item.emoji}
      </text>
    );
  };

  const equippedItems: { [key: string]: ShopItem } = {};
  Object.entries(characterState).forEach(([slot, itemId]) => {
    const item = shopItems.find((i) => i.id === itemId);
    if (item) equippedItems[slot] = item;
  });

  return (
    <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
      <motion.svg
        width={width}
        height={height}
        viewBox="0 0 100 150"
        style={{ position: "relative", display: "block" }}
        animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Background Layer */}
        {renderItem(equippedItems.background)}

        {/* Vehicle (behind character) */}
        {renderItem(equippedItems.vehicle)}

        {/* Base character */}
        <circle cx="50" cy="25" r="20" fill="#E0B98D" />
        <rect x="40" y="45" width="20" height="50" fill="#E0B98D" />
        <rect x="25" y="45" width="15" height="40" fill="#E0B98D" transform="rotate(-10 32.5 65)" />
        <rect x="60" y="45" width="15" height="40" fill="#E0B98D" transform="rotate(10 67.5 65)" />
        <rect x="40" y="95" width="15" height="50" fill="#E0B98D" />
        <rect x="45" y="95" width="15" height="50" fill="#E0B98D" />

        {/* Clothing Layers */}
        {renderItem(equippedItems.head)}
        {renderItem(equippedItems.body)}
        {renderItem(equippedItems.hands)}
        {renderItem(equippedItems.feet)}
        {renderItem(equippedItems.accessory)}

        {/* Pet Layer (beside character) */}
        {equippedItems.pet && (
           <g transform="translate(82, 115)">
              {renderItem(equippedItems.pet, true)}
           </g>
        )}
      </motion.svg>
    </div>
  );
};

export default CharacterDisplay;
