/** Pure validation rules for the staff auth screens (11A–11D). */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export const MIN_PASSWORD_LENGTH = 12;

export type PasswordRequirementId = "length" | "passphrase" | "strength";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  /** Copy from the "Password Requirements" box of 11C. */
  label: string;
  met: boolean;
};

/** Fragments that make a password easy to guess for this business. */
const GUESSABLE_FRAGMENTS = [
  "123456",
  "654321",
  "password",
  "contraseña",
  "contrasena",
  "qwerty",
  "cafecentral",
  "admin",
];

function isGuessable(password: string, email?: string): boolean {
  const compact = password.toLowerCase().replace(/\s+/g, "");
  if (compact.length === 0) return true;
  if (/^(.)\1*$/.test(compact)) return true;
  if (GUESSABLE_FRAGMENTS.some((fragment) => compact.includes(fragment))) return true;
  const emailName = email?.trim().toLowerCase().split("@")[0] ?? "";
  return emailName.length >= 3 && compact.includes(emailName);
}

/**
 * Evaluates the three rules shown in 11C. Long passphrases (spaces included) are welcome,
 * so the passphrase rule is met by any non-empty value.
 */
export function getPasswordRequirements(password: string, email?: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "12 caracteres como mínimo",
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    { id: "passphrase", label: "Se admiten frases largas", met: password.length > 0 },
    {
      id: "strength",
      label: "Evitá datos fáciles de adivinar",
      met: !isGuessable(password, email),
    },
  ];
}

export function isPasswordStrong(password: string, email?: string): boolean {
  return getPasswordRequirements(password, email).every((rule) => rule.met);
}

export type ResetPasswordError = "requirements" | "mismatch";

/** First blocking problem of the reset form, or `null` when it can be submitted. */
export function validateResetPassword(
  password: string,
  confirmation: string,
  email?: string,
): ResetPasswordError | null {
  if (!isPasswordStrong(password, email)) return "requirements";
  if (password !== confirmation) return "mismatch";
  return null;
}

export const MFA_CODE_LENGTH = 6;

/** Keeps only digits, capped at the code length (handles pasted codes like "123 456"). */
export function sanitizeMfaCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, MFA_CODE_LENGTH);
}

export function isValidMfaCode(value: string): boolean {
  return value.length === MFA_CODE_LENGTH && /^\d+$/.test(value);
}
