import { Body, Controller, Get, Put, UseFilters, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/http/zod-validation.pipe.js';
import { SessionGuard } from '../../auth/http/session.guard.js';
import {
  GetPaymentOptions,
  GetPaymentSettings,
  UpdatePaymentSettings,
  type PaymentOptions,
} from '../application/payment-settings.use-cases.js';
import { GetVenueProfile, UpdateVenueProfile } from '../application/venue-profile.use-cases.js';
import type { SavedPaymentSettings } from '../domain/payment-settings.js';
import type { PublicVenueProfile } from '../domain/venue-profile.js';
import { VenueErrorFilter } from './venue-error.filter.js';
import { paymentSettingsSchema, venueProfileSchema, type PaymentSettingsBody, type VenueProfileBody } from './venue.schemas.js';

/** Public reads for the web app; edits and the full payment settings need a staff session. */
@Controller('venue')
@UseFilters(VenueErrorFilter)
export class VenueController {
  constructor(
    private readonly getProfile: GetVenueProfile,
    private readonly updateProfile: UpdateVenueProfile,
    private readonly getPaymentSettings: GetPaymentSettings,
    private readonly updatePaymentSettings: UpdatePaymentSettings,
    private readonly getPaymentOptions: GetPaymentOptions,
  ) {}

  @Get()
  profile(): Promise<PublicVenueProfile> {
    return this.getProfile.execute();
  }

  @Put()
  @UseGuards(SessionGuard)
  saveProfile(@Body(new ZodValidationPipe(venueProfileSchema)) body: VenueProfileBody): Promise<PublicVenueProfile> {
    return this.updateProfile.execute(body);
  }

  @Get('payment-options')
  paymentOptions(): Promise<PaymentOptions> {
    return this.getPaymentOptions.execute();
  }

  @Get('payment-settings')
  @UseGuards(SessionGuard)
  paymentSettings(): Promise<SavedPaymentSettings> {
    return this.getPaymentSettings.execute();
  }

  @Put('payment-settings')
  @UseGuards(SessionGuard)
  savePaymentSettings(
    @Body(new ZodValidationPipe(paymentSettingsSchema)) body: PaymentSettingsBody,
  ): Promise<SavedPaymentSettings> {
    return this.updatePaymentSettings.execute(body);
  }
}
