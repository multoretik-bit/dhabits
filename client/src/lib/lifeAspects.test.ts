import { describe, expect, it } from "vitest";
import { getTimerActivityAspectId } from "./lifeAspects";

describe("getTimerActivityAspectId", () => {
  it.each(["Английский", "История России", "Чтение книги"])("routes %s to study", (title) => {
    expect(getTimerActivityAspectId(title, "#67e8f9")).toBe("10");
  });

  it.each(["Спорт", "Хождение пешком"])("routes %s to health", (title) => {
    expect(getTimerActivityAspectId(title, "#ffd814")).toBe("2");
  });

  it("routes any work activity to business and work", () => {
    expect(getTimerActivityAspectId("Работа над проектом", "#ffd814")).toBe("8");
  });

  it("uses the aspect color when the title has no special rule", () => {
    expect(getTimerActivityAspectId("Медитация", "#5d0794")).toBe("7");
  });

  it("keeps legacy yellow sessions in study", () => {
    expect(getTimerActivityAspectId("Конспект", "#facc15")).toBe("10");
  });
});
