/** Pure validation rules for the staff auth screens (11A–11D). */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export const MIN_PASSWORD_LENGTH = 6;

export type PasswordRequirementId = "length" | "passphrase";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  /** Copy from the "Password Requirements" box of 11C. */
  label: string;
  met: boolean;
};

/**
 * Evaluates the rules shown in 11C. Long passphrases (spaces included) are welcome,
 * so the passphrase rule is met by any non-empty value.
 */
export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "6 caracteres como mínimo",
      met: password.length >= MIN_PASSWORD_LENGTH,
    },
    { id: "passphrase", label: "Se admiten frases largas", met: password.length > 0 },
  ];
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordRequirements(password).every((rule) => rule.met);
}

export type ResetPasswordError = "requirements" | "mismatch";

/** First blocking problem of the reset form, or `null` when it can be submitted. */
export function validateResetPassword(password: string, confirmation: string): ResetPasswordError | null {
  if (!isPasswordStrong(password)) return "requirements";
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
