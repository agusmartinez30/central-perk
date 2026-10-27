import type { PaymentSettingsRepository } from '../domain/payment-settings.js';
import type { VenueProfileRepository } from '../domain/venue-profile.js';

export interface Clock {
  now(): Date;
}

/** Everything the venue use cases need, wired by `VenueModule` or by test fakes. */
export interface VenueDeps {
  profiles: VenueProfileRepository;
  paymentSettings: PaymentSettingsRepository;
  clock: Clock;
}
