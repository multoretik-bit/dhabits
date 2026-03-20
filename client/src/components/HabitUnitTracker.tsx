import { useState } from "react";
import { useApp, Habit } from "@/contexts/AppContext";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HabitUnitTrackerProps {
  habit: Habit;
  compact?: boolean;
}

export default function HabitUnitTracker({ habit, compact = false }: HabitUnitTrackerProps) {
  const { addUnitsToHabit } = useApp();
  const [amount, setAmount] = useState(1);

  if (!habit.unitsTracking) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1.5 bg-secondary/50 rounded-xl border border-border ${
        compact ? "px-1.5 py-1" : "px-2 py-1.5 mt-2"
      }`}
    >
      <span className="text-[10px] text-muted-foreground uppercase font-bold px-1">
        {habit.progressUnit || "шт"}
      </span>
      
      <div className="flex items-center gap-1 bg-background/50 rounded-lg p-0.5 border border-border/50">
        <button
          onClick={() => setAmount(Math.max(1, amount - 1))}
          className="w-5 h-5 rounded-md hover:bg-secondary flex items-center justify-center text-foreground transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-[11px] font-bold text-foreground w-4 text-center">
          {amount}
        </span>
        <button
          onClick={() => setAmount(amount + 1)}
          className="w-5 h-5 rounded-md hover:bg-secondary flex items-center justify-center text-foreground transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Button
        size="sm"
        onClick={() => addUnitsToHabit(habit.id, amount)}
        className="h-6 px-2 text-[10px] font-bold rounded-lg shadow-sm"
        style={{ backgroundColor: habit.color, color: "#fff" }}
      >
        +{amount}
      </Button>
      
      {!compact && (
        <div className="ml-auto px-2 border-l border-border/50">
          <span className="text-[10px] text-muted-foreground block leading-none">Всего</span>
          <span className="text-[12px] font-black text-foreground">{habit.units}</span>
        </div>
      )}
    </div>
  );
}
