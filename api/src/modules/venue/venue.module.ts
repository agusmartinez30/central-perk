import { Module, type Provider } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { GetPaymentOptions, GetPaymentSettings, UpdatePaymentSettings } from './application/payment-settings.use-cases.js';
import type { VenueDeps } from './application/venue-deps.js';
import { GetVenueProfile, UpdateVenueProfile } from './application/venue-profile.use-cases.js';
import type { PaymentSettingsRepository } from './domain/payment-settings.js';
import type { VenueProfileRepository } from './domain/venue-profile.js';
import { VenueController } from './http/venue.controller.js';
import { PrismaPaymentSettingsRepository, PrismaVenueProfileRepository } from './infrastructure/prisma-venue.repositories.js';
import { PAYMENT_SETTINGS_REPOSITORY, VENUE_DEPS, VENUE_PROFILE_REPOSITORY } from './venue.tokens.js';

const useCaseProviders: Provider[] = [
  GetVenueProfile,
  UpdateVenueProfile,
  GetPaymentSettings,
  UpdatePaymentSettings,
  GetPaymentOptions,
].map((UseCase: new (deps: VenueDeps) => unknown) => ({
  provide: UseCase,
  useFactory: (deps: VenueDeps) => new UseCase(deps),
  inject: [VENUE_DEPS],
}));

@Module({
  // `SessionGuard` guards the admin routes.
  imports: [AuthModule],
  controllers: [VenueController],
  providers: [
    { provide: VENUE_PROFILE_REPOSITORY, useClass: PrismaVenueProfileRepository },
    { provide: PAYMENT_SETTINGS_REPOSITORY, useClass: PrismaPaymentSettingsRepository },
    {
      provide: VENUE_DEPS,
      inject: [VENUE_PROFILE_REPOSITORY, PAYMENT_SETTINGS_REPOSITORY],
      useFactory: (profiles: VenueProfileRepository, paymentSettings: PaymentSettingsRepository): VenueDeps => ({
        profiles,
        paymentSettings,
        clock: { now: () => new Date() },
      }),
    },
    ...useCaseProviders,
  ],
})
export class VenueModule {}
