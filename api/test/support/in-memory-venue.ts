import type { VenueDeps } from '../../src/modules/venue/application/venue-deps.js';
import type {
  PaymentSettingsRepository,
  SavedPaymentSettings,
} from '../../src/modules/venue/domain/payment-settings.js';
import type { VenueProfile, VenueProfileRepository } from '../../src/modules/venue/domain/venue-profile.js';
import { FakeClock } from './in-memory-auth.js';

/** In-memory adapters for the venue ports, shared by unit specs and the HTTP e2e test. */

export class InMemoryVenueProfiles implements VenueProfileRepository {
  current: VenueProfile | null = null;

  get(): Promise<VenueProfile | null> {
    return Promise.resolve(this.current && structuredClone(this.current));
  }

  save(profile: VenueProfile): Promise<void> {
    this.current = structuredClone(profile);
    return Promise.resolve();
  }
}

export class InMemoryPaymentSettings implements PaymentSettingsRepository {
  current: SavedPaymentSettings | null = null;

  get(): Promise<SavedPaymentSettings | null> {
    return Promise.resolve(this.current && structuredClone(this.current));
  }

  save(saved: SavedPaymentSettings): Promise<void> {
    this.current = structuredClone(saved);
    return Promise.resolve();
  }
}

export function venueProfile(overrides: Partial<VenueProfile> = {}): VenueProfile {
  return {
    name: 'Café Central',
    description: 'Un espacio para disfrutar de un buen café, compartir y hacer una pausa.',
    coverImageUrl: '/assets/cafe-cover.webp',
    address: { street: 'Av. del Libertador 124', city: 'Alta Gracia, Córdoba', mapsUrl: null },
    contact: { whatsapp: '+54 9 3547 55-5124', phone: '+54 9 3547 55-5124' },
    links: [{ network: 'instagram', handle: '@cafecentral.demo', url: 'https://instagram.com/cafecentral.demo' }],
    timezone: 'America/Argentina/Cordoba',
    openingHours: [{ weekday: 'monday', opensAt: '08:00', closesAt: '20:00' }],
    ...overrides,
  };
}

export function savedPaymentSettings(overrides: Partial<SavedPaymentSettings> = {}): SavedPaymentSettings {
  return {
    version: 1,
    updatedAt: new Date('2026-10-26T09:00:00Z'),
    settings: {
      methods: { cash: true, card: true, transfer: true, other: false },
      requestModes: { table: true, register: true, transfer: true },
      bankAccount: {
        holder: 'Café Central SRL · FICTICIO',
        bank: 'Banco Demo',
        alias: 'CAFE.CENTRAL.DEMO',
        cbu: '0000000000000000000000',
        staffInstructions: 'Verificar la acreditación antes de confirmar el pago.',
      },
    },
    ...overrides,
  };
}

export function createVenueDeps() {
  return {
    profiles: new InMemoryVenueProfiles(),
    paymentSettings: new InMemoryPaymentSettings(),
    clock: new FakeClock(),
  } satisfies VenueDeps;
}
