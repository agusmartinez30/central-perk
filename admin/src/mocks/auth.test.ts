import { describe, expect, it } from "vitest";
import { DEMO_CREDENTIALS, authenticateStaff, verifyStaffMfaCode } from "./auth";

describe("authenticateStaff", () => {
  it("signs in the seeded staff member, ignoring email case and whitespace", () => {
    const result = authenticateStaff(` ${DEMO_CREDENTIALS.email.toUpperCase()} `, DEMO_CREDENTIALS.password);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.staff.name).toBe("Sofía M.");
  });

  it("rejects a wrong password or unknown email", () => {
    expect(authenticateStaff(DEMO_CREDENTIALS.email, "incorrecta")).toEqual({
      ok: false,
      error: "invalid-credentials",
    });
    expect(authenticateStaff("otro@cafecentral.com", DEMO_CREDENTIALS.password).ok).toBe(false);
  });
});

describe("verifyStaffMfaCode", () => {
  it("accepts only the demo code", () => {
    expect(verifyStaffMfaCode(DEMO_CREDENTIALS.mfaCode)).toBe(true);
    expect(verifyStaffMfaCode("000000")).toBe(false);
  });
});
