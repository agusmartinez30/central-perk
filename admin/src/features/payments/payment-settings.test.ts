import { describe, expect, it } from "vitest";
import { PAYMENT_SETTINGS, PAYMENT_SETTINGS_VIEWED_AT } from "@/mocks/payments";
import { SERVICE_DAY } from "@/mocks/service-day";
import type { PaymentSettings } from "@/mocks/types";
import {
  BANK_FIELDS,
  PAYMENT_METHOD_OPTIONS,
  REQUEST_MODE_OPTIONS,
  applySettings,
  canDisableMethod,
  TRANSFER_MODE_RULE,
  formatSavedAgo,
  formatVersionMeta,
  getSettingsChanges,
  getSettingsIssues,
  isDirty,
  isValidAlias,
  isValidCbu,
  validateBankAccount,
} from "./payment-settings";

const saved = PAYMENT_SETTINGS;
const settings = saved.settings;

function withDraft(change: (draft: PaymentSettings) => void): PaymentSettings {
  const draft = structuredClone(settings);
  change(draft);
  return draft;
}

describe("PAYMENT_SETTINGS mock", () => {
  it("matches the 06 export: every method but 'Otro' and every request mode enabled, version 18", () => {
    expect(settings.methods).toEqual({ cash: true, card: true, transfer: true, other: false });
    expect(settings.requestModes).toEqual({ table: true, register: true, transfer: true });
    expect(saved).toMatchObject({ version: 18, updatedAt: "14:38" });
  });

  it("is viewed on the service-day clock, four minutes after the last save (\"Guardado hace 4 min\")", () => {
    expect(PAYMENT_SETTINGS_VIEWED_AT).toBe(SERVICE_DAY.now);
    expect(formatSavedAgo(saved.updatedAt, PAYMENT_SETTINGS_VIEWED_AT)).toBe("Guardado hace 4 min");
  });

  it("uses obviously fictional bank data that passes the validators", () => {
    expect(settings.bankAccount).toEqual({
      holder: "Café Central SRL · FICTICIO",
      bank: "Banco Demo",
      alias: "CAFE.CENTRAL.DEMO",
      cbu: "0000000000000000000000",
      staffInstructions: "Verificar la acreditación antes de confirmar el pago.",
    });
    expect(validateBankAccount(settings.bankAccount)).toEqual({});
    expect(getSettingsIssues(settings)).toEqual([]);
  });
});

describe("options", () => {
  it("lists the methods, request modes and bank fields in the order of the designs", () => {
    expect(PAYMENT_METHOD_OPTIONS.map((option) => option.label)).toEqual([
      "Efectivo",
      "Tarjeta",
      "Transferencia",
      "Otro",
    ]);
    expect(REQUEST_MODE_OPTIONS.map((option) => option.label)).toEqual(["En mesa", "En caja", "Por transferencia"]);
    expect(BANK_FIELDS.map((field) => field.label)).toEqual([
      "Titular de la cuenta",
      "Banco o billetera",
      "Alias",
      "CBU / CVU",
      "Instrucciones para el personal",
    ]);
  });
});

describe("isValidCbu", () => {
  it("accepts 22 digits whose two check digits match", () => {
    expect(isValidCbu("0000000000000000000000")).toBe(true);
    expect(isValidCbu("0170099200000000000017")).toBe(true);
    expect(isValidCbu(" 0170099200000000000017 ")).toBe(true);
  });

  it("rejects wrong lengths, non-digits and wrong check digits", () => {
    expect(isValidCbu("017009920000000000001")).toBe(false);
    expect(isValidCbu("01700992000000000000170")).toBe(false);
    expect(isValidCbu("01700992000000000000A7")).toBe(false);
    expect(isValidCbu("0170099300000000000017")).toBe(false);
    expect(isValidCbu("0170099200000000000018")).toBe(false);
  });
});

describe("isValidAlias", () => {
  it("accepts 6 to 20 letters, digits, dots or hyphens", () => {
    expect(isValidAlias("CAFE.CENTRAL.DEMO")).toBe(true);
    expect(isValidAlias("cafe-1")).toBe(true);
    expect(isValidAlias("A".repeat(20))).toBe(true);
  });

  it("rejects short, long or invalid aliases", () => {
    expect(isValidAlias("CAFE")).toBe(false);
    expect(isValidAlias("A".repeat(21))).toBe(false);
    expect(isValidAlias("CAFE CENTRAL")).toBe(false);
    expect(isValidAlias("CAFÉ.CENTRAL")).toBe(false);
  });
});

describe("validateBankAccount", () => {
  it("requires the holder, the bank, the alias and the CBU / CVU", () => {
    expect(
      validateBankAccount({ holder: " ", bank: "", alias: "", cbu: "", staffInstructions: "" }),
    ).toEqual({
      holder: "Ingresá el titular de la cuenta.",
      bank: "Ingresá el banco o billetera.",
      alias: "Ingresá el alias.",
      cbu: "Ingresá el CBU / CVU.",
    });
  });

  it("explains invalid aliases, CBU lengths and check digits", () => {
    const base = settings.bankAccount;
    expect(validateBankAccount({ ...base, alias: "CAFE" }).alias).toBe(
      "El alias debe tener entre 6 y 20 caracteres: letras, números, puntos o guiones.",
    );
    expect(validateBankAccount({ ...base, cbu: "123" }).cbu).toBe("El CBU / CVU debe tener 22 dígitos.");
    expect(validateBankAccount({ ...base, cbu: "0000000100000000000000" }).cbu).toBe(
      "Revisá el CBU / CVU: los dígitos verificadores no coinciden.",
    );
  });

  it("limits the staff instructions to 120 characters", () => {
    const base = settings.bankAccount;
    expect(validateBankAccount({ ...base, staffInstructions: "a".repeat(120) })).toEqual({});
    expect(validateBankAccount({ ...base, staffInstructions: "a".repeat(121) }).staffInstructions).toBe(
      "Usá 120 caracteres como máximo.",
    );
  });
});

describe("getSettingsIssues", () => {
  it("requires at least one enabled payment method", () => {
    const draft = withDraft((d) => {
      d.methods = { cash: false, card: false, transfer: false, other: false };
      d.requestModes.transfer = false;
    });
    expect(getSettingsIssues(draft)).toEqual([
      { id: "no-method", message: "Debe permanecer habilitado al menos un medio de cobro." },
    ]);
  });

  it("requires the transfer method while customers can ask to pay by transfer", () => {
    const draft = withDraft((d) => {
      d.methods.transfer = false;
    });
    expect(getSettingsIssues(draft)).toEqual([
      {
        id: "transfer-mode-requirements",
        message: "La modalidad “Por transferencia” requiere Transferencia activa y datos bancarios válidos.",
      },
    ]);
    expect(getSettingsIssues(withDraft((d) => {
      d.methods.transfer = false;
      d.requestModes.transfer = false;
    }))).toEqual([]);
  });

  it("blocks saving invalid bank data", () => {
    const draft = withDraft((d) => {
      d.bankAccount.alias = "x";
    });
    expect(getSettingsIssues(draft).map((issue) => issue.id)).toEqual(["invalid-bank-account"]);
  });
});

describe("canDisableMethod", () => {
  it("keeps the last enabled method on", () => {
    const methods = { cash: true, card: false, transfer: false, other: false };
    expect(canDisableMethod(methods, "cash")).toBe(false);
    expect(canDisableMethod({ ...methods, card: true }, "cash")).toBe(true);
    expect(canDisableMethod(methods, "card")).toBe(true);
  });
});

describe("getSettingsChanges / isDirty", () => {
  it("has no changes for an untouched draft", () => {
    expect(getSettingsChanges(settings, structuredClone(settings))).toEqual([]);
    expect(isDirty(settings, structuredClone(settings))).toBe(false);
  });

  it("lists toggles and bank fields in the order of the screen", () => {
    const draft = withDraft((d) => {
      d.bankAccount.alias = "CAFE.CENTRAL.PRUEBA";
      d.requestModes.register = false;
      d.methods.other = true;
    });
    expect(getSettingsChanges(settings, draft)).toEqual([
      { id: "methods.other", section: "Medios de cobro", label: "Otro", from: "Deshabilitado", to: "Habilitado" },
      { id: "requestModes.register", section: "Modalidades", label: "En caja", from: "Habilitada", to: "Deshabilitada" },
      {
        id: "bankAccount.alias",
        section: "Datos bancarios",
        label: "Alias",
        from: "CAFE.CENTRAL.DEMO",
        to: "CAFE.CENTRAL.PRUEBA",
      },
    ]);
    expect(isDirty(settings, draft)).toBe(true);
  });

  it("ignores surrounding whitespace in bank fields", () => {
    const draft = withDraft((d) => {
      d.bankAccount.bank = "  Banco Demo ";
    });
    expect(isDirty(settings, draft)).toBe(false);
  });
});

describe("applySettings", () => {
  it("saves a changed draft as the next version with trimmed bank fields", () => {
    const draft = withDraft((d) => {
      d.methods.other = true;
      d.bankAccount.alias = " CAFE.CENTRAL.PRUEBA ";
    });
    const next = applySettings(saved, draft, "10:15");
    expect(next.version).toBe(19);
    expect(next.updatedAt).toBe("10:15");
    expect(next.settings.methods.other).toBe(true);
    expect(next.settings.bankAccount.alias).toBe("CAFE.CENTRAL.PRUEBA");
    expect(saved.settings.methods.other).toBe(false);
  });

  it("keeps the saved version when nothing changed", () => {
    expect(applySettings(saved, structuredClone(settings), "10:15")).toBe(saved);
  });
});

describe("saved status copy", () => {
  it("describes the saved version", () => {
    expect(formatVersionMeta(saved)).toBe("Versión 18 · actualizada hoy 14:38");
  });

  it("counts whole minutes since the last save, within the hour", () => {
    expect(formatSavedAgo("14:38", "14:42")).toBe("Guardado hace 4 min");
    expect(formatSavedAgo("13:43", "14:42")).toBe("Guardado hace 59 min");
  });

  it("says 'recién' for a save in the current minute (or a clock behind it)", () => {
    expect(formatSavedAgo("14:42", "14:42")).toBe("Guardado recién");
    expect(formatSavedAgo("14:45", "14:42")).toBe("Guardado recién");
  });

  it("falls back to the time of day after an hour", () => {
    expect(formatSavedAgo("09:42", "14:42")).toBe("Guardado hoy 09:42");
  });
});

describe("06 copy", () => {
  it("names the request modes as the customer sees them", () => {
    expect(REQUEST_MODE_OPTIONS.map((option) => [option.customerLabel, option.customerDescription])).toEqual([
      ["En mi mesa", "Nos acercamos a cobrarte"],
      ["En caja", "Pagá en el mostrador"],
      ["Por transferencia", "Te indicamos cómo realizarla"],
    ]);
  });

  it("describes methods and modes as the updated export does", () => {
    expect(PAYMENT_METHOD_OPTIONS.map((option) => option.description)).toEqual([
      "Cobros registrados por el personal.",
      "Terminal física o dispositivo externo.",
      "Requiere verificación manual de acreditación.",
      "Medio adicional con descripción.",
    ]);
    expect(REQUEST_MODE_OPTIONS.map((option) => option.description)).toEqual([
      "El personal se acerca a cobrar.",
      "El cliente se acerca al mostrador.",
      "El personal comparte las instrucciones.",
    ]);
    expect(TRANSFER_MODE_RULE).toBe(
      "La modalidad “Por transferencia” requiere Transferencia activa y datos bancarios válidos.",
    );
  });
});
