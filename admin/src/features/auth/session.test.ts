import { describe, expect, it } from "vitest";
import { parseStoredSession, serializeSession } from "./session";

describe("parseStoredSession", () => {
  it("round-trips a serialized session", () => {
    const raw = serializeSession({ stage: "mfa-pending", staffId: "staff-sofia" });
    expect(parseStoredSession(raw)).toEqual({ stage: "mfa-pending", staffId: "staff-sofia" });
  });

  it("returns null for missing, malformed or unknown data", () => {
    expect(parseStoredSession(null)).toBeNull();
    expect(parseStoredSession("not json")).toBeNull();
    expect(parseStoredSession(JSON.stringify({ stage: "admin", staffId: "x" }))).toBeNull();
    expect(parseStoredSession(JSON.stringify({ stage: "authenticated" }))).toBeNull();
  });
});
