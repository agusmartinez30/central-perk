import { DEMO_STAFF } from "./staff";
import type { StaffMember } from "./types";

/** Demo credentials for the prototype (documented in the README). */
export const DEMO_CREDENTIALS = {
  email: DEMO_STAFF.email,
  password: "Mostrador2026!",
  mfaCode: "123456",
} as const;

export type AuthResult =
  | { ok: true; staff: StaffMember }
  | { ok: false; error: "invalid-credentials" };

/** Mock credential check against the single seeded staff account. */
export function authenticateStaff(email: string, password: string): AuthResult {
  const emailMatches = email.trim().toLowerCase() === DEMO_CREDENTIALS.email;
  if (emailMatches && password === DEMO_CREDENTIALS.password) {
    return { ok: true, staff: DEMO_STAFF };
  }
  return { ok: false, error: "invalid-credentials" };
}

/** Mock authenticator-app check. */
export function verifyStaffMfaCode(code: string): boolean {
  return code === DEMO_CREDENTIALS.mfaCode;
}
