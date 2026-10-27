/**
 * Password rules shown on the admin reset screen (11C). Keep in sync with
 * `admin/src/features/auth/validation.ts`.
 */

export const MIN_PASSWORD_LENGTH = 12;

export type PasswordRequirementId = 'length' | 'passphrase' | 'strength';

/** Fragments that make a password easy to guess for this business. */
const GUESSABLE_FRAGMENTS = ['123456', '654321', 'password', 'contraseña', 'contrasena', 'qwerty', 'cafecentral', 'admin'];

function isGuessable(password: string, email?: string): boolean {
  const compact = password.toLowerCase().replace(/\s+/g, '');
  if (compact.length === 0) return true;
  if (/^(.)\1*$/.test(compact)) return true;
  if (GUESSABLE_FRAGMENTS.some((fragment) => compact.includes(fragment))) return true;
  const emailName = email?.trim().toLowerCase().split('@')[0] ?? '';
  return emailName.length >= 3 && compact.includes(emailName);
}

/** Requirements the password fails, in display order; empty when it is acceptable. */
export function unmetPasswordRequirements(password: string, email: string | undefined): PasswordRequirementId[] {
  const unmet: PasswordRequirementId[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) unmet.push('length');
  if (password.length === 0) unmet.push('passphrase');
  if (isGuessable(password, email)) unmet.push('strength');
  return unmet;
}
