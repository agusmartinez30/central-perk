import type { PrismaClient } from '../src/generated/prisma/client.js';
import { paymentSettingsIssues, type PaymentSettings } from '../src/modules/venue/domain/payment-settings.js';
import { normalizeVenueProfile, venueProfileIssues, type VenueProfile } from '../src/modules/venue/domain/venue-profile.js';
import { VENUE_ID } from '../src/modules/venue/infrastructure/venue-id.js';

/**
 * Sample venue from the client mocks: `web/src/mocks/cafe-info.ts` (profile) and
 * `admin/src/mocks/payments.ts` (payment settings). The bank account is the exports' fictional
 * placeholder, not a real account.
 */
const STREET = 'Av. del Libertador 124';
const CITY = 'Alta Gracia, Córdoba';
const PHONE = '+54 9 3547 55-5124';

const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export const SEED_VENUE_PROFILE: VenueProfile = {
  name: 'Café Central',
  description: 'Un espacio para disfrutar de un buen café, compartir y hacer una pausa.',
  coverImageUrl: '/assets/cafe-cover.webp',
  address: {
    street: STREET,
    city: CITY,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${STREET}, ${CITY}`)}`,
  },
  contact: { whatsapp: PHONE, phone: PHONE },
  links: [
    { network: 'instagram', handle: '@cafecentral.demo', url: 'https://instagram.com/cafecentral.demo' },
    { network: 'facebook', handle: 'Café Central Alta Gracia', url: 'https://facebook.com/cafecentral.demo' },
    { network: 'website', handle: 'cafecentral.demo', url: 'https://cafecentral.demo' },
  ],
  timezone: 'America/Argentina/Cordoba',
  openingHours: [
    ...weekdays.map((weekday) => ({ weekday, opensAt: '08:00', closesAt: '20:00' })),
    { weekday: 'saturday', opensAt: '09:00', closesAt: '21:00' },
  ],
};

export const SEED_PAYMENT_SETTINGS: PaymentSettings = {
  methods: { cash: true, card: true, transfer: true, other: false },
  requestModes: { table: true, register: true, transfer: true },
  bankAccount: {
    holder: 'Café Central SRL · FICTICIO',
    bank: 'Banco Demo',
    alias: 'CAFE.CENTRAL.DEMO',
    cbu: '0000000000000000000000',
    staffInstructions: 'Verificar la acreditación antes de confirmar el pago.',
  },
};

/** Creates the venue and its payment settings when missing; never overwrites admin edits. */
export async function seedVenue(prisma: PrismaClient): Promise<void> {
  const profile = normalizeVenueProfile(SEED_VENUE_PROFILE);
  const profileIssues = venueProfileIssues(profile);
  if (profileIssues.length > 0) throw new Error(`Seed venue profile is invalid: ${JSON.stringify(profileIssues)}`);
  const settingsIssues = paymentSettingsIssues(SEED_PAYMENT_SETTINGS);
  if (settingsIssues.length > 0) throw new Error(`Seed payment settings are invalid: ${settingsIssues.join(', ')}`);

  await prisma.venue.upsert({
    where: { id: VENUE_ID },
    update: {},
    create: {
      id: VENUE_ID,
      name: profile.name,
      description: profile.description,
      coverImageUrl: profile.coverImageUrl,
      addressStreet: profile.address?.street ?? null,
      addressCity: profile.address?.city ?? null,
      addressMapsUrl: profile.address?.mapsUrl ?? null,
      whatsapp: profile.contact.whatsapp,
      phone: profile.contact.phone,
      timezone: profile.timezone,
      links: {
        create: profile.links.map((link, position) => ({ ...link, network: upper(link.network), position })),
      },
      openingHours: {
        create: profile.openingHours.map((hours) => ({ ...hours, weekday: upper(hours.weekday) })),
      },
    },
  });

  const { methods, requestModes, bankAccount } = SEED_PAYMENT_SETTINGS;
  await prisma.venuePaymentSettings.upsert({
    where: { venueId: VENUE_ID },
    update: {},
    create: {
      venueId: VENUE_ID,
      acceptedMethods: enabled(methods).map(upper),
      billRequestModes: enabled(requestModes).map(upper),
      bankHolder: bankAccount.holder,
      bankName: bankAccount.bank,
      bankAlias: bankAccount.alias,
      bankCbu: bankAccount.cbu,
      staffInstructions: bankAccount.staffInstructions,
      version: 1,
      updatedAt: new Date(),
    },
  });
}

/** Prisma enum values are the uppercase form of the domain identifiers. */
function upper<Value extends string>(value: Value): Uppercase<Value> {
  return value.toUpperCase() as Uppercase<Value>;
}

function enabled<Key extends string>(flags: Record<Key, boolean>): Key[] {
  return (Object.keys(flags) as Key[]).filter((key) => flags[key]);
}
