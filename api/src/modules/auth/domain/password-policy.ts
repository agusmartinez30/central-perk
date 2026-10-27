/**
 * Password rules shown on the admin reset screen (11C). Keep in sync with
 * `admin/src/features/auth/validation.ts`.
 */

export const MIN_PASSWORD_LENGTH = 6;

export type PasswordRequirementId = 'length' | 'passphrase';

/** Requirements the password fails, in display order; empty when it is acceptable. */
export function unmetPasswordRequirements(password: string): PasswordRequirementId[] {
  const unmet: PasswordRequirementId[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) unmet.push('length');
  if (password.length === 0) unmet.push('passphrase');
  return unmet;
}
