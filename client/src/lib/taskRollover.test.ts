import { describe, expect, it } from "vitest";
import { rollOverOverdueTasks } from "./taskRollover";

describe("rollOverOverdueTasks", () => {
  it("moves an unfinished dated task to today and marks its original due date", () => {
    const [task] = rollOverOverdueTasks([
      { id: "late", specificDate: "2026-07-15", completedDates: {} },
    ], "2026-07-17");

    expect(task).toMatchObject({ specificDate: "2026-07-17", overdueSince: "2026-07-15" });
  });

  it("does not move a task completed on its scheduled date", () => {
    const tasks = [{ id: "done", specificDate: "2026-07-15", completedDates: { "2026-07-15": true } }];
    expect(rollOverOverdueTasks(tasks, "2026-07-17")).toBe(tasks);
  });

  it("leaves today, future, and recurring tasks unchanged", () => {
    const tasks = [
      { id: "today", specificDate: "2026-07-17", completedDates: {} },
      { id: "future", specificDate: "2026-07-18", completedDates: {} },
      { id: "recurring", completedDates: {} },
    ];
    expect(rollOverOverdueTasks(tasks, "2026-07-17")).toBe(tasks);
  });

  it("preserves the first missed date when carried again", () => {
    const [task] = rollOverOverdueTasks([
      { id: "late", specificDate: "2026-07-16", overdueSince: "2026-07-14", completedDates: {} },
    ], "2026-07-17");
    expect(task.overdueSince).toBe("2026-07-14");
  });
});
