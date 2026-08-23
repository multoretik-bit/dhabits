import { describe, expect, it } from "vitest";
import type { ActivitySession } from "@/contexts/AppContext";
import { groupActivitySessionsByTitle } from "./activitySessions";

function session(id: string, title: string, color: string, durationSeconds: number): ActivitySession {
  return {
    id,
    title,
    color,
    durationSeconds,
    date: "2026-08-23",
    startedAt: "2026-08-23T10:00:00.000Z",
    endedAt: "2026-08-23T10:30:00.000Z",
  };
}

describe("groupActivitySessionsByTitle", () => {
  it("combines the same activity name regardless of color and letter case", () => {
    const groups = groupActivitySessionsByTitle([
      session("1", "Английский", "#ffd814", 16 * 60),
      session("2", " английский ", "#ffb000", 3 * 60),
      session("3", "АНГЛИЙСКИЙ", "#fff000", 3 * 60),
      session("4", "Чтение", "#ffd814", 21 * 60),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.key === "английский")).toMatchObject({
      seconds: 22 * 60,
      sessions: [{ id: "1" }, { id: "2" }, { id: "3" }],
    });
  });
});
