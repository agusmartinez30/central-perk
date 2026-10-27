/** Nest DI tokens for the venue ports, so tests can override any adapter. */
export const VENUE_DEPS = Symbol('VENUE_DEPS');
export const VENUE_PROFILE_REPOSITORY = Symbol('VENUE_PROFILE_REPOSITORY');
export const PAYMENT_SETTINGS_REPOSITORY = Symbol('PAYMENT_SETTINGS_REPOSITORY');
