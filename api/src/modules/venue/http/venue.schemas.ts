import { z } from 'zod';
import { WEEKDAYS } from '../domain/opening-hours.js';
import { BILL_REQUEST_MODES, PAYMENT_METHODS } from '../domain/payment-settings.js';
import { LINK_NETWORKS } from '../domain/venue-profile.js';

/** Request bodies. Business rules (CBU check digits, hours order, …) live in the domain, not here. */

/** Only http(s), because the web app renders these as links. */
const httpUrl = z.url({ protocol: /^https?$/ }).max(2048);

const flags = <const Keys extends readonly string[]>(keys: Keys) =>
  z.strictObject(Object.fromEntries(keys.map((key) => [key, z.boolean()])) as Record<Keys[number], z.ZodBoolean>);

export const venueProfileSchema = z.object({
  name: z.string().max(120),
  description: z.string().max(1000).nullable(),
  // An absolute URL or a path served by the web app ("/assets/cafe-cover.webp").
  coverImageUrl: z.union([httpUrl, z.string().regex(/^\/(?!\/)\S*$/).max(2048)]),
  address: z
    .object({
      street: z.string().max(200),
      city: z.string().max(200),
      mapsUrl: httpUrl.nullable(),
    })
    .nullable(),
  contact: z.object({
    whatsapp: z.string().max(40).nullable(),
    phone: z.string().max(40).nullable(),
  }),
  links: z
    .array(z.object({ network: z.enum(LINK_NETWORKS), handle: z.string().max(120), url: httpUrl.nullable() }))
    .max(LINK_NETWORKS.length),
  timezone: z.string().max(64),
  openingHours: z
    .array(z.object({ weekday: z.enum(WEEKDAYS), opensAt: z.string().max(5), closesAt: z.string().max(5) }))
    .max(WEEKDAYS.length),
});

export const paymentSettingsSchema = z.object({
  methods: flags(PAYMENT_METHODS),
  requestModes: flags(BILL_REQUEST_MODES),
  bankAccount: z.object({
    holder: z.string().max(120),
    bank: z.string().max(120),
    alias: z.string().max(40),
    cbu: z.string().max(40),
    // The 120-character rule is a domain rule; this only bounds the payload.
    staffInstructions: z.string().max(1000),
  }),
});

export type VenueProfileBody = z.output<typeof venueProfileSchema>;
export type PaymentSettingsBody = z.output<typeof paymentSettingsSchema>;
