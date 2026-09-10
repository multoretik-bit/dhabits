export const NUTRITION_TARGETS = {
  calories: 1800,
  protein: 150,
  fat: 60,
  carbs: 190,
} as const;

export const MAINTENANCE_CALORIES = 2100;

interface CalorieBurnHabit {
  name?: string;
  progressUnit?: string;
  units?: number;
  unitsByDate?: Record<string, number>;
}

export function isCalorieBurnSource(nameValue?: string, unitValue?: string) {
  const name = (nameValue || "").toLocaleLowerCase("ru-RU");
  const unit = (unitValue || "").toLocaleLowerCase("ru-RU");
  return name.includes("сж") && (name.includes("кал") || unit.includes("ккал") || unit.includes("кал"));
}

export interface NutritionValues {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type NutritionEntry = Partial<NutritionValues>;

export function getNutritionTotals(entries: NutritionEntry[]): NutritionValues {
  return entries.reduce<NutritionValues>((totals, entry) => ({
    calories: totals.calories + Math.max(0, Number(entry.calories) || 0),
    protein: totals.protein + Math.max(0, Number(entry.protein) || 0),
    fat: totals.fat + Math.max(0, Number(entry.fat) || 0),
    carbs: totals.carbs + Math.max(0, Number(entry.carbs) || 0),
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
}

export function getExceededNutritionTargets(totals: NutritionValues) {
  return (Object.keys(NUTRITION_TARGETS) as Array<keyof NutritionValues>)
    .filter((key) => totals[key] > NUTRITION_TARGETS[key])
    .map((key) => ({ key, exceededBy: Math.round((totals[key] - NUTRITION_TARGETS[key]) * 10) / 10 }));
}

export function getBurnedCaloriesForDate(habits: CalorieBurnHabit[], date: string, today: string) {
  return habits.reduce((total, habit) => {
    if (!isCalorieBurnSource(habit.name, habit.progressUnit)) return total;
    const datedValue = habit.unitsByDate?.[date];
    const value = datedValue === undefined && date === today ? habit.units : datedValue;
    return total + Math.max(0, Number(value) || 0);
  }, 0);
}

export function getDailyCalorieDeficit(eatenCalories: number, burnedCalories: number) {
  return MAINTENANCE_CALORIES - Math.max(0, eatenCalories) + Math.max(0, burnedCalories);
}
