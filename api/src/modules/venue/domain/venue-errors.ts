import type { BankAccountErrors, PaymentSettingsIssue } from './payment-settings.js';
import type { VenueProfileIssue } from './venue-profile.js';

export abstract class VenueError extends Error {
  abstract readonly code: string;
}

/** The single venue row has not been seeded yet (`npm run db:seed`). */
export class VenueNotConfiguredError extends VenueError {
  readonly code = 'venue_not_configured';
  constructor() {
    super('The venue has not been configured');
  }
}

export class InvalidVenueProfileError extends VenueError {
  readonly code = 'invalid_venue_profile';
  constructor(readonly issues: VenueProfileIssue[]) {
    super('Venue profile does not meet the rules');
  }
}

export class InvalidPaymentSettingsError extends VenueError {
  readonly code = 'invalid_payment_settings';
  constructor(
    readonly issues: PaymentSettingsIssue[],
    readonly bankAccount: BankAccountErrors,
  ) {
    super('Payment settings do not meet the rules');
  }
}
