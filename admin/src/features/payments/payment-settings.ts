import type {
  AcceptedPaymentMethod,
  BankAccount,
  BillPaymentMethod,
  PaymentSettings,
  SavedPaymentSettings,
} from "@/mocks/types";

export type PaymentMethodOption = { id: AcceptedPaymentMethod; label: string; description: string };

/** "Medios de cobro aceptados", in the order of the 06 export. */
export const PAYMENT_METHOD_OPTIONS: readonly PaymentMethodOption[] = [
  { id: "cash", label: "Efectivo", description: "Cobros en efectivo registrados por el personal." },
  { id: "card", label: "Tarjeta", description: "Pagos con terminal física o dispositivo externo." },
  { id: "transfer", label: "Transferencia", description: "Transferencias bancarias verificadas manualmente." },
  { id: "other", label: "Otro", description: "Otros medios registrados con una descripción." },
];

export type RequestModeOption = {
  id: BillPaymentMethod;
  label: string;
  /** Admin-facing description ("Preference Description"). */
  description: string;
  /** Customer-facing description of the live 08 preview. */
  customerDescription: string;
};

/** "Modalidades para solicitar la cuenta", in the order of the 06 export. */
export const REQUEST_MODE_OPTIONS: readonly RequestModeOption[] = [
  {
    id: "table",
    label: "En mesa",
    description: "El personal se acerca a cobrar.",
    customerDescription: "Nos acercamos a cobrarte.",
  },
  {
    id: "register",
    label: "En caja",
    description: "El cliente se acerca al mostrador.",
    customerDescription: "Pagá en el mostrador.",
  },
  {
    id: "transfer",
    label: "Por transferencia",
    description: "El personal indica cómo realizar el pago.",
    customerDescription: "Te indicamos cómo realizarla.",
  },
];

export type BankField = keyof BankAccount;

/** "Datos bancarios" fields, in the order of the export. */
export const BANK_FIELDS: readonly { id: BankField; label: string }[] = [
  { id: "holder", label: "Titular de la cuenta" },
  { id: "bank", label: "Banco o billetera" },
  { id: "alias", label: "Alias" },
  { id: "cbu", label: "CBU / CVU" },
  { id: "staffInstructions", label: "Instrucciones para el personal" },
];

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
  return (
    hasValidCheckDigit(cbu.slice(0, 8), CBU_FIRST_BLOCK_WEIGHTS) &&
    hasValidCheckDigit(cbu.slice(8), CBU_SECOND_BLOCK_WEIGHTS)
  );
}

/** 6 to 20 letters (no accents), digits, dots or hyphens. */
export function isValidAlias(value: string): boolean {
  return /^[A-Za-z0-9.-]{6,20}$/.test(value.trim());
}

export type BankAccountErrors = Partial<Record<BankField, string>>;

/** Field errors of the bank form; the copy is not in the 06 exports. */
export function validateBankAccount(account: BankAccount): BankAccountErrors {
  const errors: BankAccountErrors = {};
  if (!account.holder.trim()) errors.holder = "Ingresá el titular de la cuenta.";
  if (!account.bank.trim()) errors.bank = "Ingresá el banco o billetera.";

  if (!account.alias.trim()) errors.alias = "Ingresá el alias.";
  else if (!isValidAlias(account.alias))
    errors.alias = "El alias debe tener entre 6 y 20 caracteres: letras, números, puntos o guiones.";

  const cbu = account.cbu.trim();
  if (!cbu) errors.cbu = "Ingresá el CBU / CVU.";
  else if (!/^\d{22}$/.test(cbu)) errors.cbu = "El CBU / CVU debe tener 22 dígitos.";
  else if (!isValidCbu(cbu)) errors.cbu = "Revisá el CBU / CVU: los dígitos verificadores no coinciden.";

  if (account.staffInstructions.trim().length > STAFF_INSTRUCTIONS_MAX_LENGTH)
    errors.staffInstructions = `Usá ${STAFF_INSTRUCTIONS_MAX_LENGTH} caracteres como máximo.`;
  return errors;
}

export type SettingsIssueId = "no-method" | "transfer-mode-requirements" | "invalid-bank-account";
export type SettingsIssue = { id: SettingsIssueId; message: string };

/** Rule shown under the methods ("Method Minimum Rule"). */
export const MINIMUM_METHOD_RULE = "Debe permanecer habilitado al menos un medio de cobro.";
/** Rule shown under the bank form ("Bank Transfer Dependency"). */
export const TRANSFER_MODE_RULE =
  "La modalidad “Por transferencia” requiere el medio Transferencia activo y datos bancarios válidos.";

/** Rules that block saving `draft`; an empty list means it can be saved. */
export function getSettingsIssues(draft: PaymentSettings): SettingsIssue[] {
  const issues: SettingsIssue[] = [];
  if (!Object.values(draft.methods).some(Boolean)) issues.push({ id: "no-method", message: MINIMUM_METHOD_RULE });
  if (draft.requestModes.transfer && !draft.methods.transfer)
    issues.push({ id: "transfer-mode-requirements", message: TRANSFER_MODE_RULE });
  if (Object.keys(validateBankAccount(draft.bankAccount)).length > 0)
    issues.push({ id: "invalid-bank-account", message: "Revisá los datos bancarios antes de guardar." });
  return issues;
}

/** The last enabled method cannot be turned off. */
export function canDisableMethod(
  methods: PaymentSettings["methods"],
  method: AcceptedPaymentMethod,
): boolean {
  if (!methods[method]) return true;
  return Object.values(methods).filter(Boolean).length > 1;
}

export type SettingsChange = { id: string; section: string; label: string; from: string; to: string };

/** Differences between the saved settings and the draft, in the order of the screen. */
export function getSettingsChanges(saved: PaymentSettings, draft: PaymentSettings): SettingsChange[] {
  const changes: SettingsChange[] = [];
  for (const option of PAYMENT_METHOD_OPTIONS) {
    if (saved.methods[option.id] !== draft.methods[option.id]) {
      const [from, to] = saved.methods[option.id] ? ["Habilitado", "Deshabilitado"] : ["Deshabilitado", "Habilitado"];
      changes.push({ id: `methods.${option.id}`, section: "Medios de cobro", label: option.label, from, to });
    }
  }
  for (const option of REQUEST_MODE_OPTIONS) {
    if (saved.requestModes[option.id] !== draft.requestModes[option.id]) {
      const [from, to] = saved.requestModes[option.id]
        ? ["Habilitada", "Deshabilitada"]
        : ["Deshabilitada", "Habilitada"];
      changes.push({ id: `requestModes.${option.id}`, section: "Modalidades", label: option.label, from, to });
    }
  }
  for (const field of BANK_FIELDS) {
    const from = saved.bankAccount[field.id].trim();
    const to = draft.bankAccount[field.id].trim();
    if (from !== to) {
      changes.push({ id: `bankAccount.${field.id}`, section: "Datos bancarios", label: field.label, from, to });
    }
  }
  return changes;
}

export function isDirty(saved: PaymentSettings, draft: PaymentSettings): boolean {
  return getSettingsChanges(saved, draft).length > 0;
}

function trimBankAccount(account: BankAccount): BankAccount {
  return {
    holder: account.holder.trim(),
    bank: account.bank.trim(),
    alias: account.alias.trim(),
    cbu: account.cbu.trim(),
    staffInstructions: account.staffInstructions.trim(),
  };
}

/**
 * Saves `draft` as the next version, updated at `now` ("HH:MM"). An unchanged draft keeps the
 * saved settings (same object), so confirming without changes does not bump the version.
 */
export function applySettings(
  saved: SavedPaymentSettings,
  draft: PaymentSettings,
  now: string,
): SavedPaymentSettings {
  if (!isDirty(saved.settings, draft)) return saved;
  return {
    version: saved.version + 1,
    updatedAt: now,
    settings: {
      methods: { ...draft.methods },
      requestModes: { ...draft.requestModes },
      bankAccount: trimBankAccount(draft.bankAccount),
    },
  };
}

/** "Configuración sin cambios" (export) or "N cambios sin guardar" (not in the exports). */
export function formatChangesTitle(count: number): string {
  if (count === 0) return "Configuración sin cambios";
  return count === 1 ? "1 cambio sin guardar" : `${count} cambios sin guardar`;
}

/** "Versión 18 · actualizada hoy 09:42". */
export function formatVersionMeta(saved: Pick<SavedPaymentSettings, "version" | "updatedAt">): string {
  return `Versión ${saved.version} · actualizada hoy ${saved.updatedAt}`;
}
