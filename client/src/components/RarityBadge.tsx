import React from "react";
import { cn } from "@/lib/utils";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "legacy";

interface RarityBadgeProps {
  rarity: Rarity;
  className?: string;
  showIcon?: boolean;
}

const RARITY_CONFIG = {
  legacy: {
    label: "Раритет",
    subLabel: "До обновления",
    color: "bg-amber-950/40 text-amber-500 border-amber-900/50",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    icon: "🕰️",
  },
  common: {
    label: "Обычный",
    color: "bg-slate-800/80 text-slate-300 border-slate-700/50",
    glow: "",
    icon: "⚪",
  },
  rare: {
    label: "Редкий",
    color: "bg-blue-900/30 text-blue-400 border-blue-800/50",
    glow: "shadow-[0_0_10px_rgba(59,130,246,0.15)]",
    icon: "🔷",
  },
  epic: {
    label: "Эпический",
    color: "bg-purple-900/30 text-purple-400 border-purple-800/50",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    icon: "🔮",
  },
  legendary: {
    label: "Легендарный",
    color: "bg-orange-900/30 text-orange-400 border-orange-800/50",
    glow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    icon: "🌟",
  },
};

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, className, showIcon = true }) => {
  const config = RARITY_CONFIG[rarity];

  return (
    <div
      className={cn(
        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1",
        config.color,
        config.glow,
        className
      )}
    >
      {showIcon && <span>{config.icon}</span>}
      <div className="flex flex-col leading-none">
        <span>{config.label}</span>
        {rarity === "legacy" && <span className="text-[7px] opacity-70 font-bold">До обновления</span>}
      </div>
    </div>
  );
};
