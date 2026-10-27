import {
  applyPaymentSettings,
  enabledRequestModes,
  paymentSettingsIssues,
  validateBankAccount,
  type BillRequestMode,
  type PaymentSettings,
  type SavedPaymentSettings,
} from '../domain/payment-settings.js';
import { InvalidPaymentSettingsError, VenueNotConfiguredError } from '../domain/venue-errors.js';
import type { VenueDeps } from './venue-deps.js';

async function loadSettings(deps: VenueDeps): Promise<SavedPaymentSettings> {
  const saved = await deps.paymentSettings.get();
  if (!saved) throw new VenueNotConfiguredError();
  return saved;
}

/** Full configuration, bank account included (admin). */
export class GetPaymentSettings {
  constructor(private readonly deps: VenueDeps) {}

  execute(): Promise<SavedPaymentSettings> {
    return loadSettings(this.deps);
  }
}

/** Saves the admin draft as the next version; an unchanged draft keeps the current version. */
export class UpdatePaymentSettings {
  constructor(private readonly deps: VenueDeps) {}

  async execute(draft: PaymentSettings): Promise<SavedPaymentSettings> {
    const issues = paymentSettingsIssues(draft);
    if (issues.length > 0) throw new InvalidPaymentSettingsError(issues, validateBankAccount(draft.bankAccount));

    const saved = await loadSettings(this.deps);
    const next = applyPaymentSettings(saved, draft, this.deps.clock.now());
    if (next !== saved) await this.deps.paymentSettings.save(next);
    return next;
  }
}

export interface PaymentOptions {
  requestModes: BillRequestMode[];
}

/**
 * What the customer bill screen needs: the enabled request modes. Bank details stay private because
 * the web app tells customers that staff will share them.
 */
export class GetPaymentOptions {
  constructor(private readonly deps: VenueDeps) {}

  async execute(): Promise<PaymentOptions> {
    return { requestModes: enabledRequestModes((await loadSettings(this.deps)).settings) };
  }
}
