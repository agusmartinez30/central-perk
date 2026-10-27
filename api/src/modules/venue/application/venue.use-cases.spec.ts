import { beforeEach, describe, expect, it } from 'vitest';
import { createVenueDeps, savedPaymentSettings, venueProfile } from '../../../../test/support/in-memory-venue.js';
import { InvalidPaymentSettingsError, InvalidVenueProfileError, VenueNotConfiguredError } from '../domain/venue-errors.js';
import { GetPaymentOptions, GetPaymentSettings, UpdatePaymentSettings } from './payment-settings.use-cases.js';
import { GetVenueProfile, UpdateVenueProfile } from './venue-profile.use-cases.js';

describe('venue use cases', () => {
  let deps: ReturnType<typeof createVenueDeps>;

  beforeEach(() => {
    deps = createVenueDeps();
  });

  describe('profile', () => {
    it('fails while the venue is not configured', async () => {
      await expect(new GetVenueProfile(deps).execute()).rejects.toBeInstanceOf(VenueNotConfiguredError);
    });

    it('returns the profile with its open status at the clock time', async () => {
      deps.profiles.current = venueProfile();

      // FakeClock: Monday 2026-10-26 12:00Z = 09:00 in Córdoba.
      await expect(new GetVenueProfile(deps).execute()).resolves.toEqual({
        ...venueProfile(),
        openStatus: { open: true, closesAt: '20:00' },
      });
    });

    it('saves a normalized profile', async () => {
      const result = await new UpdateVenueProfile(deps).execute(venueProfile({ name: ' Café Central Centro ', description: ' ' }));

      expect(deps.profiles.current).toMatchObject({ name: 'Café Central Centro', description: null });
      expect(result).toMatchObject({ name: 'Café Central Centro', openStatus: { open: true } });
    });

    it('rejects an invalid profile without saving', async () => {
      const error = await new UpdateVenueProfile(deps).execute(venueProfile({ name: '' })).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InvalidVenueProfileError);
      expect((error as InvalidVenueProfileError).issues).toEqual([{ path: 'name', code: 'required' }]);
      expect(deps.profiles.current).toBeNull();
    });
  });

  describe('payment settings', () => {
    beforeEach(() => {
      deps.paymentSettings.current = savedPaymentSettings();
    });

    it('fails while the venue is not configured', async () => {
      deps.paymentSettings.current = null;
      await expect(new GetPaymentSettings(deps).execute()).rejects.toBeInstanceOf(VenueNotConfiguredError);
      await expect(new GetPaymentOptions(deps).execute()).rejects.toBeInstanceOf(VenueNotConfiguredError);
    });

    it('saves a change as the next version at the clock time', async () => {
      const { settings } = savedPaymentSettings();

      const result = await new UpdatePaymentSettings(deps).execute({ ...settings, methods: { ...settings.methods, other: true } });

      expect(result).toMatchObject({ version: 2, updatedAt: deps.clock.now(), settings: { methods: { other: true } } });
      expect(deps.paymentSettings.current).toEqual(result);
    });

    it('keeps the version when nothing changed', async () => {
      const result = await new UpdatePaymentSettings(deps).execute(savedPaymentSettings().settings);

      expect(result).toEqual(savedPaymentSettings());
    });

    it('rejects settings that break the admin rules, with bank field errors', async () => {
      const { settings } = savedPaymentSettings();
      const draft = { ...settings, methods: { ...settings.methods, transfer: false }, bankAccount: { ...settings.bankAccount, cbu: '12' } };

      const error = await new UpdatePaymentSettings(deps).execute(draft).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InvalidPaymentSettingsError);
      expect(error).toMatchObject({ issues: ['transfer_mode_requirements', 'invalid_bank_account'], bankAccount: { cbu: 'invalid_format' } });
      expect(deps.paymentSettings.current).toEqual(savedPaymentSettings());
    });

    it('exposes only the enabled bill request modes publicly', async () => {
      const { settings } = savedPaymentSettings();
      deps.paymentSettings.current = savedPaymentSettings({ settings: { ...settings, requestModes: { table: true, register: false, transfer: true } } });

      await expect(new GetPaymentOptions(deps).execute()).resolves.toEqual({ requestModes: ['table', 'transfer'] });
    });
  });
});
