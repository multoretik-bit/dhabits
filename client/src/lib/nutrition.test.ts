import { describe, expect, it } from "vitest";
import { getBurnedCaloriesForDate, getDailyCalorieDeficit, getExceededNutritionTargets, getNutritionTotals } from "./nutrition";

describe("nutrition diary", () => {
  it("sums calories and macros for a day", () => {
    expect(getNutritionTotals([
      { calories: 400, protein: 20, fat: 8, carbs: 62 },
      { calories: 250, protein: 35, fat: 7, carbs: 10 },
    ])).toEqual({ calories: 650, protein: 55, fat: 15, carbs: 72 });
  });

  it("ignores invalid and negative values", () => {
    expect(getNutritionTotals([{ calories: -50, protein: Number.NaN }])).toEqual({ calories: 0, protein: 0, fat: 0, carbs: 0 });
  });

  it("reports every exceeded daily limit", () => {
    expect(getExceededNutritionTargets({ calories: 1850, protein: 150, fat: 63.5, carbs: 180 })).toEqual([
      { key: "calories", exceededBy: 50 },
      { key: "fat", exceededBy: 3.5 },
    ]);
  });

  it("calculates deficit from food and burned-calorie habits", () => {
    const burned = getBurnedCaloriesForDate([
      { name: "Сжигание калорий", progressUnit: "ккал", units: 120, unitsByDate: { "2026-09-10": 60 } },
      { name: "Чтение", progressUnit: "мин", units: 30 },
    ], "2026-09-10", "2026-09-10");
    expect(burned).toBe(60);
    expect(getDailyCalorieDeficit(1800, burned)).toBe(360);
  });
});
