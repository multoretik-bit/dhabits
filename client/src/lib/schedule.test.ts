import { describe, expect, it } from "vitest";
import { getCurrentBlock } from "./schedule";

const blocks = [
  { id: "morning", startTime: "09:00", endTime: "10:00" },
  { id: "work", startTime: "16:00", endTime: "18:00" },
  { id: "night", startTime: "23:00", endTime: "01:00" },
];

function at(hours: number, minutes: number) {
  const date = new Date(2026, 6, 17, hours, minutes);
  return getCurrentBlock(blocks, date)?.id ?? null;
}

describe("getCurrentBlock", () => {
  it("switches to a block exactly at its start", () => expect(at(16, 0)).toBe("work"));
  it("keeps the block active until its end", () => expect(at(17, 59)).toBe("work"));
  it("stops the block exactly at its end", () => expect(at(18, 0)).toBeNull());
  it("supports blocks that cross midnight", () => {
    expect(at(23, 30)).toBe("night");
    expect(at(0, 30)).toBe("night");
  });
});
