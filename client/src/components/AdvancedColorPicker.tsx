import { useState } from "react";

interface AdvancedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#ef4444",
  "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
  "#6366f1", "#a855f7", "#d946ef", "#f472b6", "#94a3b8",
];

export default function AdvancedColorPicker({ value, onChange, label }: AdvancedColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}
      <div className="flex gap-2 items-center">
        <div
          className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm font-mono"
          placeholder="#6366f1"
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-border bg-secondary"
        />
      </div>
      {showPicker && (
        <div className="p-3 bg-card border border-border rounded-lg">
          <div className="grid grid-cols-10 gap-2">
            {PRESET_COLORS.map((color, i) => (
              <button
                key={`${color}-${i}`}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowPicker(false);
                }}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderColor: value === color ? "white" : "transparent",
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
