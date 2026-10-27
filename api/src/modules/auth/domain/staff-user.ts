export const STAFF_ROLES = ['OWNER', 'MANAGER', 'STAFF'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface StaffUser {
  id: string;
  /** Stored lowercase and trimmed. */
  email: string;
  name: string;
  role: StaffRole;
  passwordHash: string;
  /** Base32 TOTP secret; `null` when the user has no authenticator app enrolled. */
  mfaSecret: string | null;
  /** Last accepted TOTP time step, so a code cannot be replayed. */
  mfaLastUsedStep: number | null;
}

/** Public projection returned to clients. */
export interface StaffProfile {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
}

export function toStaffProfile({ id, email, name, role }: StaffUser): StaffProfile {
  return { id, email, name, role };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface StaffUserRepository {
  findByEmail(email: string): Promise<StaffUser | null>;
  findById(id: string): Promise<StaffUser | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  recordMfaStep(id: string, step: number): Promise<void>;
}
