import { useEffect } from "react";
import { Check } from "lucide-react";
import { LIFE_ASPECTS } from "@/lib/lifeAspects";

interface AdvancedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function AdvancedColorPicker({ value, onChange, label }: AdvancedColorPickerProps) {
  const selectedAspect = LIFE_ASPECTS.find((aspect) => aspect.color.toLowerCase() === value.toLowerCase());

  useEffect(() => {
    if (!selectedAspect) onChange(LIFE_ASPECTS[0].color);
  }, [onChange, selectedAspect]);

  return (
    <div className="aspect-color-picker">
      {label && <label className="text-sm font-medium text-foreground block">{label}</label>}
      <div className="aspect-color-current">
        <span style={{ backgroundColor: selectedAspect?.color || LIFE_ASPECTS[0].color }} />
        <div><strong>{selectedAspect?.name || "Моя внешность"}</strong><small>Основной аспект жизни</small></div>
      </div>
      <div className="aspect-color-grid" role="radiogroup" aria-label="Цвет аспекта жизни">
        {LIFE_ASPECTS.map((aspect) => {
          const selected = aspect.color.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={aspect.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={aspect.name}
              title={aspect.name}
              className={selected ? "is-selected" : ""}
              onClick={() => onChange(aspect.color)}
              style={{ "--aspect-color": aspect.color } as React.CSSProperties}
            >
              <span>{selected && <Check size={14} strokeWidth={3} />}</span>
              <small>{aspect.name}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
