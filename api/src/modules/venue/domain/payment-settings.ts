/**
 * Payment configuration of the admin 06 screens ("Métodos y modalidades", "Datos bancarios").
 * Rules mirror `admin/src/features/payments/payment-settings.ts`; keep them in sync.
 */

/** "Medios de cobro aceptados": methods staff can record when collecting an account. */
export const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * "Modalidades para solicitar la cuenta" offered to customers. The web client calls `register`
 * "cashier".
 */
export const BILL_REQUEST_MODES = ['table', 'register', 'transfer'] as const;
export type BillRequestMode = (typeof BILL_REQUEST_MODES)[number];

/** Account customers transfer to. Only staff see it; customers get instructions from staff. */
export interface BankAccount {
  holder: string;
  bank: string;
  alias: string;
  /** CBU / CVU: 22 digits. */
  cbu: string;
  staffInstructions: string;
}

export const BANK_FIELDS = ['holder', 'bank', 'alias', 'cbu', 'staffInstructions'] as const satisfies readonly (keyof BankAccount)[];
export type BankField = (typeof BANK_FIELDS)[number];

export interface PaymentSettings {
  methods: Record<PaymentMethod, boolean>;
  requestModes: Record<BillRequestMode, boolean>;
  bankAccount: BankAccount;
}

export interface SavedPaymentSettings {
  settings: PaymentSettings;
  /** Bumped on every effective change ("Versión 18"). */
  version: number;
  updatedAt: Date;
}

export const STAFF_INSTRUCTIONS_MAX_LENGTH = 120;

const CBU_FIRST_BLOCK_WEIGHTS = [7, 1, 3, 9, 7, 1, 3];
const CBU_SECOND_BLOCK_WEIGHTS = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

/** The last digit of `block` is the check digit of the others under `weights`. */
function hasValidCheckDigit(block: string, weights: readonly number[]): boolean {
  const sum = weights.reduce((total, weight, index) => total + weight * Number(block[index]), 0);
  return (10 - (sum % 10)) % 10 === Number(block[weights.length]);
}

/** 22 digits with both CBU / CVU check digits (entity block of 8, account block of 14). */
export function isValidCbu(value: string): boolean {
  const cbu = value.trim();
  if (!/^\d{22}$/.test(cbu)) return false;
  return hasValidCheckDigit(cbu.slice(0, 8), CBU_FIRST_BLOCK_WEIGHTS) && hasValidCheckDigit(cbu.slice(8), CBU_SECOND_BLOCK_WEIGHTS);
}

/** 6 to 20 letters (no accents), digits, dots or hyphens. */
export function isValidAlias(value: string): boolean {
  return /^[A-Za-z0-9.-]{6,20}$/.test(value.trim());
}

export type BankAccountIssue = 'required' | 'invalid_format' | 'invalid_check_digits' | 'too_long';
export type BankAccountErrors = Partial<Record<BankField, BankAccountIssue>>;

/** Field errors of the bank form; the admin maps each code to its Spanish copy. */
export function validateBankAccount(account: BankAccount): BankAccountErrors {
  const errors: BankAccountErrors = {};
  if (!account.holder.trim()) errors.holder = 'required';
  if (!account.bank.trim()) errors.bank = 'required';

  if (!account.alias.trim()) errors.alias = 'required';
  else if (!isValidAlias(account.alias)) errors.alias = 'invalid_format';

  const cbu = account.cbu.trim();
  if (!cbu) errors.cbu = 'required';
  else if (!/^\d{22}$/.test(cbu)) errors.cbu = 'invalid_format';
  else if (!isValidCbu(cbu)) errors.cbu = 'invalid_check_digits';

  if (account.staffInstructions.trim().length > STAFF_INSTRUCTIONS_MAX_LENGTH) errors.staffInstructions = 'too_long';
  return errors;
}

export type PaymentSettingsIssue = 'no_method' | 'transfer_mode_requirements' | 'invalid_bank_account';

/** Rules that block saving `settings`; an empty list means it can be saved. */
export function paymentSettingsIssues(settings: PaymentSettings): PaymentSettingsIssue[] {
  const issues: PaymentSettingsIssue[] = [];
  if (!PAYMENT_METHODS.some((method) => settings.methods[method])) issues.push('no_method');
  if (settings.requestModes.transfer && !settings.methods.transfer) issues.push('transfer_mode_requirements');
  if (Object.keys(validateBankAccount(settings.bankAccount)).length > 0) issues.push('invalid_bank_account');
  return issues;
}

/** Request modes customers can choose, in display order. */
export function enabledRequestModes(settings: PaymentSettings): BillRequestMode[] {
  return BILL_REQUEST_MODES.filter((mode) => settings.requestModes[mode]);
}

function normalizeSettings({ methods, requestModes, bankAccount }: PaymentSettings): PaymentSettings {
  const trimmed = Object.fromEntries(BANK_FIELDS.map((field) => [field, bankAccount[field].trim()])) as unknown as BankAccount;
  return {
    methods: Object.fromEntries(PAYMENT_METHODS.map((method) => [method, methods[method]])) as PaymentSettings['methods'],
    requestModes: Object.fromEntries(BILL_REQUEST_MODES.map((mode) => [mode, requestModes[mode]])) as PaymentSettings['requestModes'],
    bankAccount: trimmed,
  };
}

function sameSettings(a: PaymentSettings, b: PaymentSettings): boolean {
  return (
    PAYMENT_METHODS.every((method) => a.methods[method] === b.methods[method]) &&
    BILL_REQUEST_MODES.every((mode) => a.requestModes[mode] === b.requestModes[mode]) &&
    BANK_FIELDS.every((field) => a.bankAccount[field].trim() === b.bankAccount[field].trim())
  );
}

/**
 * Saves `draft` as the next version at `now`. An unchanged draft returns `saved` itself, so saving
 * without changes does not bump the version (as the admin does).
 */
export function applyPaymentSettings(saved: SavedPaymentSettings, draft: PaymentSettings, now: Date): SavedPaymentSettings {
  if (sameSettings(saved.settings, draft)) return saved;
  return { settings: normalizeSettings(draft), version: saved.version + 1, updatedAt: now };
}

/** Single-venue store for the payment configuration. */
export interface PaymentSettingsRepository {
  /** `null` until the venue is seeded. */
  get(): Promise<SavedPaymentSettings | null>;
  save(saved: SavedPaymentSettings): Promise<void>;
}
