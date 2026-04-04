import React, { useMemo } from "react";
import { HabitBlock } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Clock, Link as LinkIcon } from "lucide-react";

interface TimelineProps {
  blocks: HabitBlock[];
  selectedDate: Date;
  onBlockClick?: (blockId: string) => void;
  activeBlockId?: string | null;
}

function timeToMinutes(t: string | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function Timeline({ blocks, selectedDate, onBlockClick, activeBlockId }: TimelineProps) {
  const dayOfWeek = selectedDate.getDay();
  
  // Filter and sort blocks for the selected day
  const dailyBlocks = useMemo(() => {
    return blocks
      .filter((b) => b.startTime && b.endTime) // Basic filter for valid times
      .filter((b) => !b.daysOfWeek || b.daysOfWeek.length === 0 || b.daysOfWeek.includes(dayOfWeek))
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  }, [blocks, dayOfWeek]);

  // Generate timeline slots including gaps
  const slots = useMemo(() => {
    const result: { type: "block" | "rest"; start: number; end: number; block?: HabitBlock }[] = [];
    let currentTime = 0; // 00:00

    dailyBlocks.forEach((block) => {
      const startM = timeToMinutes(block.startTime);
      const endM = timeToMinutes(block.endTime);

      if (startM > currentTime) {
        result.push({ type: "rest", start: currentTime, end: startM });
      }

      result.push({ type: "block", start: startM, end: endM, block });
      currentTime = endM;
    });

    if (currentTime < 1440) {
      result.push({ type: "rest", start: currentTime, end: 1440 });
    }

    return result;
  }, [dailyBlocks]);

  const PIXELS_PER_MINUTE = 1.8;

  return (
    <div className="flex flex-col h-full bg-slate-950/20 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/5">
        <Clock className="w-4 h-4 text-zinc-400" />
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Schedule</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <div className="relative">
          {slots.map((slot, index) => {
            const height = (slot.end - slot.start) * PIXELS_PER_MINUTE;
            if (height < 10) return null; // Skip very small gaps

            if (slot.type === "block" && slot.block) {
              const b = slot.block;
              const isSelected = activeBlockId === b.id;
              const color = b.color || (b.colorIndex !== undefined ? ["#00d9ff", "#0066ff", "#cc00ff", "#00cc00", "#ffcc00", "#ff0000", "#ff00ff", "#ff6600"][b.colorIndex] : "#3b82f6");
              
              return (
                <div key={index} className="flex gap-4 mb-2">
                  <div className="w-12 text-[10px] font-bold text-zinc-500 pt-1 text-right">
                    {formatTime(slot.start)}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onBlockClick?.(b.id)}
                    className={cn(
                      "flex-1 p-4 rounded-2xl relative overflow-hidden transition-all text-left border",
                      isSelected ? "border-white/20 shadow-lg" : "border-white/5 bg-white/5 hover:bg-white/10"
                    )}
                    style={{ 
                      minHeight: Math.max(height, 60),
                      backgroundColor: isSelected ? `${color}20` : undefined,
                      borderLeft: `4px solid ${color}`
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm font-black text-white leading-tight truncate">{b.name}</span>
                          {b.systemUrl && <LinkIcon className="w-3 h-3 text-blue-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
                          {formatTime(slot.start)} — {formatTime(slot.end)}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 text-lg">
                        {b.habits?.[0]?.emoji || "📂"}
                      </div>
                    </div>
                  </motion.button>
                </div>
              );
            }

            // Rest slot
            return (
              <div key={index} className="flex gap-4 mb-2 opacity-30">
                <div className="w-12 text-[10px] font-bold text-zinc-600 pt-1 text-right">
                  {formatTime(slot.start)}
                </div>
                <div 
                  className="flex-1 flex items-center px-4 rounded-2xl border border-dashed border-white/10"
                  style={{ minHeight: Math.max(height * 0.5, 40) }}
                >
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Rest</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
