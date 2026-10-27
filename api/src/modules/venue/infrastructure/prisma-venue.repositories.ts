import { Injectable } from '@nestjs/common';
import type {
  BillRequestMode as BillRequestModeRow,
  PaymentMethod as PaymentMethodRow,
  VenueLinkNetwork as VenueLinkNetworkRow,
  Weekday as WeekdayRow,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { sortOpeningHours, type Weekday } from '../domain/opening-hours.js';
import {
  BILL_REQUEST_MODES,
  PAYMENT_METHODS,
  type PaymentSettingsRepository,
  type SavedPaymentSettings,
} from '../domain/payment-settings.js';
import type { LinkNetwork, VenueProfile, VenueProfileRepository } from '../domain/venue-profile.js';
import { VENUE_ID } from './venue-id.js';

/** Domain identifiers are the lowercase form of the Prisma enum values. */
const toRow = <Row extends string>(value: string) => value.toUpperCase() as Row;
const fromRow = <Value extends string>(row: string) => row.toLowerCase() as Value;

@Injectable()
export class PrismaVenueProfileRepository implements VenueProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<VenueProfile | null> {
    const row = await this.prisma.venue.findUnique({
      where: { id: VENUE_ID },
      include: { links: { orderBy: { position: 'asc' } }, openingHours: true },
    });
    if (!row) return null;
    const address =
      row.addressStreet !== null && row.addressCity !== null
        ? { street: row.addressStreet, city: row.addressCity, mapsUrl: row.addressMapsUrl }
        : null;
    return {
      name: row.name,
      description: row.description,
      coverImageUrl: row.coverImageUrl,
      address,
      contact: { whatsapp: row.whatsapp, phone: row.phone },
      links: row.links.map((link) => ({ network: fromRow<LinkNetwork>(link.network), handle: link.handle, url: link.url })),
      timezone: row.timezone,
      openingHours: sortOpeningHours(
        row.openingHours.map((hours) => ({ weekday: fromRow<Weekday>(hours.weekday), opensAt: hours.opensAt, closesAt: hours.closesAt })),
      ),
    };
  }

  async save(profile: VenueProfile): Promise<void> {
    const fields = {
      name: profile.name,
      description: profile.description,
      coverImageUrl: profile.coverImageUrl,
      addressStreet: profile.address?.street ?? null,
      addressCity: profile.address?.city ?? null,
      addressMapsUrl: profile.address?.mapsUrl ?? null,
      whatsapp: profile.contact.whatsapp,
      phone: profile.contact.phone,
      timezone: profile.timezone,
    };
    const links = profile.links.map((link, position) => ({
      network: toRow<VenueLinkNetworkRow>(link.network),
      position,
      handle: link.handle,
      url: link.url,
    }));
    const openingHours = profile.openingHours.map((hours) => ({ ...hours, weekday: toRow<WeekdayRow>(hours.weekday) }));
    // Nested writes run in one transaction: links and hours are replaced as a whole.
    await this.prisma.venue.upsert({
      where: { id: VENUE_ID },
      create: { id: VENUE_ID, ...fields, links: { create: links }, openingHours: { create: openingHours } },
      update: {
        ...fields,
        links: { deleteMany: {}, create: links },
        openingHours: { deleteMany: {}, create: openingHours },
      },
    });
  }
}

@Injectable()
export class PrismaPaymentSettingsRepository implements PaymentSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<SavedPaymentSettings | null> {
    const row = await this.prisma.venuePaymentSettings.findUnique({ where: { venueId: VENUE_ID } });
    if (!row) return null;
    const methods = new Set(row.acceptedMethods.map((method) => fromRow<string>(method)));
    const modes = new Set(row.billRequestModes.map((mode) => fromRow<string>(mode)));
    return {
      version: row.version,
      updatedAt: row.updatedAt,
      settings: {
        methods: Object.fromEntries(PAYMENT_METHODS.map((method) => [method, methods.has(method)])) as SavedPaymentSettings['settings']['methods'],
        requestModes: Object.fromEntries(BILL_REQUEST_MODES.map((mode) => [mode, modes.has(mode)])) as SavedPaymentSettings['settings']['requestModes'],
        bankAccount: {
          holder: row.bankHolder,
          bank: row.bankName,
          alias: row.bankAlias,
          cbu: row.bankCbu,
          staffInstructions: row.staffInstructions,
        },
      },
    };
  }

  async save({ settings, version, updatedAt }: SavedPaymentSettings): Promise<void> {
    const { bankAccount } = settings;
    await this.prisma.venuePaymentSettings.update({
      where: { venueId: VENUE_ID },
      data: {
        acceptedMethods: PAYMENT_METHODS.filter((method) => settings.methods[method]).map((method) => toRow<PaymentMethodRow>(method)),
        billRequestModes: BILL_REQUEST_MODES.filter((mode) => settings.requestModes[mode]).map((mode) => toRow<BillRequestModeRow>(mode)),
        bankHolder: bankAccount.holder,
        bankName: bankAccount.bank,
        bankAlias: bankAccount.alias,
        bankCbu: bankAccount.cbu,
        staffInstructions: bankAccount.staffInstructions,
        version,
        updatedAt,
      },
    });
  }
}
