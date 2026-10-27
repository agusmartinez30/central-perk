import { describe, expect, it } from 'vitest';
import {
  applyPaymentSettings,
  enabledRequestModes,
  isValidAlias,
  isValidCbu,
  paymentSettingsIssues,
  validateBankAccount,
  type BankAccount,
  type PaymentSettings,
  type SavedPaymentSettings,
} from './payment-settings.js';

const BANK: BankAccount = {
  holder: 'Café Central SRL · FICTICIO',
  bank: 'Banco Demo',
  alias: 'CAFE.CENTRAL.DEMO',
  cbu: '0000000000000000000000',
  staffInstructions: 'Verificar la acreditación antes de confirmar el pago.',
};

const SETTINGS: PaymentSettings = {
  methods: { cash: true, card: true, transfer: true, other: false },
  requestModes: { table: true, register: true, transfer: true },
  bankAccount: BANK,
};

describe('bank account rules (mirror admin 06 "Datos bancarios")', () => {
  it('accepts CBU / CVU values whose two check digits match', () => {
    expect(isValidCbu('0000000000000000000000')).toBe(true);
    expect(isValidCbu('0170099200000000000017')).toBe(true);
    expect(isValidCbu(' 0170099200000000000017 ')).toBe(true);
  });

  it('rejects wrong lengths and wrong check digits', () => {
    expect(isValidCbu('01700992000000000000170')).toBe(false);
    expect(isValidCbu('0170099300000000000017')).toBe(false);
    expect(isValidCbu('0170099200000000000018')).toBe(false);
  });

  it('accepts aliases of 6 to 20 unaccented letters, digits, dots or hyphens', () => {
    expect(isValidAlias('CAFE.CENTRAL.DEMO')).toBe(true);
    expect(isValidAlias('cafe-1')).toBe(true);
    expect(isValidAlias('A'.repeat(20))).toBe(true);
    for (const alias of ['CAFE', 'A'.repeat(21), 'CAFE CENTRAL', 'CAFÉ.CENTRAL']) expect(isValidAlias(alias)).toBe(false);
  });

  it('reports every field error with a stable code', () => {
    expect(validateBankAccount({ holder: ' ', bank: '', alias: '', cbu: '', staffInstructions: '' })).toEqual({
      holder: 'required',
      bank: 'required',
      alias: 'required',
      cbu: 'required',
    });
    expect(validateBankAccount({ ...BANK, alias: 'CAFE', cbu: '123', staffInstructions: 'x'.repeat(121) })).toEqual({
      alias: 'invalid_format',
      cbu: 'invalid_format',
      staffInstructions: 'too_long',
    });
    expect(validateBankAccount({ ...BANK, cbu: '0000000100000000000000' })).toEqual({ cbu: 'invalid_check_digits' });
    expect(validateBankAccount(BANK)).toEqual({});
  });
});

describe('payment settings rules', () => {
  it('accepts the seeded settings', () => {
    expect(paymentSettingsIssues(SETTINGS)).toEqual([]);
  });

  it('requires at least one accepted method', () => {
    const methods = { cash: false, card: false, transfer: false, other: false };
    expect(paymentSettingsIssues({ ...SETTINGS, methods, requestModes: { ...SETTINGS.requestModes, transfer: false } })).toEqual([
      'no_method',
    ]);
  });

  it('requires the transfer method when customers can ask to pay by transfer', () => {
    const methods = { ...SETTINGS.methods, transfer: false };
    expect(paymentSettingsIssues({ ...SETTINGS, methods })).toEqual(['transfer_mode_requirements']);
  });

  it('blocks saving an invalid bank account', () => {
    expect(paymentSettingsIssues({ ...SETTINGS, bankAccount: { ...BANK, cbu: '1' } })).toEqual(['invalid_bank_account']);
  });

  it('lists enabled request modes in display order', () => {
    expect(enabledRequestModes({ ...SETTINGS, requestModes: { table: false, register: true, transfer: true } })).toEqual([
      'register',
      'transfer',
    ]);
  });
});

describe('applyPaymentSettings', () => {
  const saved: SavedPaymentSettings = { settings: SETTINGS, version: 3, updatedAt: new Date('2026-10-26T10:00:00Z') };
  const now = new Date('2026-10-26T12:00:00Z');

  it('keeps the saved version when nothing changed (bank fields compared trimmed)', () => {
    const draft = { ...SETTINGS, bankAccount: { ...BANK, alias: ` ${BANK.alias} ` } };
    expect(applyPaymentSettings(saved, draft, now)).toBe(saved);
  });

  it('bumps the version and trims the bank account on a change', () => {
    const draft = { ...SETTINGS, methods: { ...SETTINGS.methods, other: true }, bankAccount: { ...BANK, bank: ' Banco Nuevo ' } };
    expect(applyPaymentSettings(saved, draft, now)).toEqual({
      version: 4,
      updatedAt: now,
      settings: { ...draft, bankAccount: { ...BANK, bank: 'Banco Nuevo' } },
    });
  });
});
