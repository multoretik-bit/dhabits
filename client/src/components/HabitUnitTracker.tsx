import { useState } from "react";
import { useApp, Habit } from "@/contexts/AppContext";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HabitUnitTrackerProps {
  habit: Habit;
  compact?: boolean;
}

export default function HabitUnitTracker({ habit, compact = false, alwaysShow = false }: HabitUnitTrackerProps & { alwaysShow?: boolean }) {
  const { addUnitsToHabit } = useApp();
  const [amount, setAmount] = useState(1);

  if (!habit.unitsTracking && !alwaysShow) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center justify-between w-full bg-slate-900/60 rounded-xl border border-slate-800/80 ${
        compact ? "px-2 py-1" : "px-3 py-2 mt-2"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest px-1">
          Всего
        </span>
        <span 
          className="text-xs font-black px-1"
          style={{ color: habit.color || '#3b82f6' }}
        >
          {habit.units} <span className="text-[10px] text-slate-400 opacity-80">{habit.progressUnit || "шт"}</span>
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1">
          {[1, 5, 10].map((num) => (
            <Button
              key={num}
              size="sm"
              variant="outline"
              onClick={() => addUnitsToHabit(habit.id, num)}
              className="h-7 px-2 text-[10px] font-bold border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 text-slate-300"
            >
              +{num}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-1 border border-slate-800/50 ml-1">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
            className="bg-transparent text-white text-[10px] font-bold w-10 text-center outline-none border-none focus:ring-0"
          />
        </div>

        <Button
          size="sm"
          onClick={() => {
            addUnitsToHabit(habit.id, amount);
            setAmount(1);
          }}
          className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg active:scale-95 transition-all"
          style={{ backgroundColor: habit.color, color: "#fff" }}
        >
          +{amount}
        </Button>
      </div>
    </div>
  );
}
