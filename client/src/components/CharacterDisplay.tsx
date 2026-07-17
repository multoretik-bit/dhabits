import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useApp, ShopItem } from "@/contexts/AppContext";

interface CharacterDisplayProps {
  width?: number;
  height?: number;
  level?: number;
  showLevelBadge?: boolean;
}

function getAuraColor(level: number): string | null {
  if (level >= 20) return "#F472B6";
  if (level >= 10) return "#FBBF24";
  if (level >= 5) return "#CBD5E1";
  if (level >= 1) return "#CD7F32";
  return null;
}

const CharacterDisplay: React.FC<CharacterDisplayProps> = ({ width = 150, height = 200, level = 0, showLevelBadge = false }) => {
  const { characterState, shopItems } = useApp();
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const auraColor = getAuraColor(level);
  const appearance = characterState.appearance || {};
  const skinTop = appearance.skin || "#F3C99B";
  const skinBottom = appearance.skin ? `color-mix(in srgb, ${appearance.skin} 76%, #8B5E3C)` : "#E0AD78";
  const shirtTop = appearance.shirt || "#818CF8";
  const shirtBottom = appearance.shirt ? `color-mix(in srgb, ${appearance.shirt} 70%, #1E1B4B)` : "#4F46E5";
  const pantsTop = appearance.pants || "#475569";
  const pantsBottom = appearance.pants ? `color-mix(in srgb, ${appearance.pants} 68%, #111827)` : "#334155";
  const hairTop = appearance.hair || "#6B4A32";
  const hairBottom = appearance.hair ? `color-mix(in srgb, ${appearance.hair} 72%, #20140E)` : "#4A3020";
  
  const renderItem = (item?: ShopItem, isPet?: boolean) => {
    if (!item) return null;

    // Image file support (PNG/SVG/JPG/WEBP files served from /public)
    if (item.assetPath && /\.(png|svg|jpe?g|webp)$/i.test(item.assetPath)) {
      return (
        <image
          href={item.assetPath}
          x={isPet ? "-50" : "0"} y={isPet ? "-50" : "0"}
          width={isPet ? "100" : "100"} height={isPet ? "100" : "150"}
          preserveAspectRatio="xMidYMid meet"
        />
      );
    }

    // Inline SVG markup support (legacy clothing items)
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
        style={{ position: "relative", display: "block", overflow: "visible" }}
        animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
        transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <defs>
          <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={skinTop} />
            <stop offset="100%" stopColor={skinBottom} />
          </linearGradient>
          <linearGradient id={`shirt-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={shirtTop} />
            <stop offset="100%" stopColor={shirtBottom} />
          </linearGradient>
          <linearGradient id={`pants-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pantsTop} />
            <stop offset="100%" stopColor={pantsBottom} />
          </linearGradient>
          <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={hairTop} />
            <stop offset="100%" stopColor={hairBottom} />
          </linearGradient>
        </defs>

        {/* Background Layer */}
        {renderItem(equippedItems.background)}

        {/* Vehicle (behind character) */}
        {renderItem(equippedItems.vehicle)}

        {/* Level aura */}
        {auraColor && (
          <circle cx="50" cy="88" r="58" fill="none" stroke={auraColor} strokeWidth="2" opacity="0.45" />
        )}

        {/* Base character */}
        <g>
          {/* back arms (behind torso) */}
          <rect x="23" y="52" width="12" height="38" rx="6" fill={`url(#skin-${uid})`} transform="rotate(-8 29 71)" />
          <rect x="65" y="52" width="12" height="38" rx="6" fill={`url(#skin-${uid})`} transform="rotate(8 71 71)" />
          <circle cx="27" cy="90" r="6" fill={`url(#skin-${uid})`} />
          <circle cx="73" cy="90" r="6" fill={`url(#skin-${uid})`} />

          {/* legs */}
          <rect x="37" y="94" width="12" height="42" rx="6" fill={`url(#pants-${uid})`} />
          <rect x="51" y="94" width="12" height="42" rx="6" fill={`url(#pants-${uid})`} />
          <ellipse cx="42" cy="140" rx="9" ry="5" fill="#1E293B" />
          <ellipse cx="58" cy="140" rx="9" ry="5" fill="#1E293B" />

          {/* torso (default outfit shown when nothing equipped in body slot) */}
          <rect x="31" y="48" width="38" height="46" rx="14" fill={`url(#shirt-${uid})`} />
          <path d="M31 58 Q50 66 69 58" stroke="#3730A3" strokeWidth="2" fill="none" opacity="0.4" />

          {/* neck */}
          <rect x="44" y="38" width="12" height="10" rx="4" fill={`url(#skin-${uid})`} />

          {/* head */}
          <circle cx="50" cy="26" r="18" fill={`url(#skin-${uid})`} />
          <circle cx="35" cy="27" r="3.2" fill={`url(#skin-${uid})`} />
          <circle cx="65" cy="27" r="3.2" fill={`url(#skin-${uid})`} />

          {/* hair */}
          <path d="M31 24 Q31 6 50 6 Q69 6 69 24 Q69 14 50 14 Q31 14 31 24 Z" fill={`url(#hair-${uid})`} />
          <path d="M31 22 Q28 30 32 36" stroke={`url(#hair-${uid})`} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M69 22 Q72 30 68 36" stroke={`url(#hair-${uid})`} strokeWidth="5" fill="none" strokeLinecap="round" />

          {/* face */}
          <circle cx="43" cy="27" r="2.1" fill="#3B2A1A" />
          <circle cx="57" cy="27" r="2.1" fill="#3B2A1A" />
          <path d="M43 35 Q50 40 57 35" stroke="#8A5A3A" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* front arms (in front of torso) */}
          <rect x="20" y="50" width="12" height="36" rx="6" fill={`url(#skin-${uid})`} transform="rotate(-14 26 68)" />
          <rect x="68" y="50" width="12" height="36" rx="6" fill={`url(#skin-${uid})`} transform="rotate(14 74 68)" />
          <circle cx="23" cy="86" r="6.5" fill={`url(#skin-${uid})`} />
          <circle cx="77" cy="86" r="6.5" fill={`url(#skin-${uid})`} />
        </g>

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

      {showLevelBadge && level > 0 && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md border"
          style={{
            background: auraColor ? `${auraColor}22` : "rgba(99,102,241,0.15)",
            borderColor: auraColor ? `${auraColor}66` : "rgba(99,102,241,0.4)",
            color: auraColor || "#818CF8",
          }}
        >
          Ур. {level}
        </div>
      )}
    </div>
  );
};

export default CharacterDisplay;
