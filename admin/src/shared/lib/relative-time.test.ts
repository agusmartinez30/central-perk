import { describe, expect, it } from "vitest";
import { formatRelativeDayTime } from "./relative-time";

const now = new Date(2026, 9, 26, 15, 0);

describe("formatRelativeDayTime", () => {
  it("says hoy for the same day", () => {
    expect(formatRelativeDayTime(new Date(2026, 9, 26, 10, 32).toISOString(), now)).toBe("hoy, 10:32");
  });

  it("says ayer for the previous day", () => {
    expect(formatRelativeDayTime(new Date(2026, 9, 25, 9, 5).toISOString(), now)).toBe("ayer, 09:05");
  });

  it("shows day and month for older dates", () => {
    expect(formatRelativeDayTime(new Date(2026, 8, 3, 18, 40).toISOString(), now)).toBe("03/09, 18:40");
  });
});
