import { describe, expect, it } from 'vitest';
import { openStatusAt, type OpeningHours } from './opening-hours.js';
import { normalizeVenueProfile, venueProfileIssues, type VenueProfile } from './venue-profile.js';

const TIMEZONE = 'America/Argentina/Cordoba';

const WEEK: OpeningHours[] = [
  ...(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((weekday) => ({
    weekday,
    opensAt: '08:00',
    closesAt: '20:00',
  })),
  { weekday: 'saturday', opensAt: '09:00', closesAt: '21:00' },
];

const PROFILE: VenueProfile = {
  name: 'Café Central',
  description: 'Un espacio para disfrutar de un buen café.',
  coverImageUrl: '/assets/cafe-cover.webp',
  address: { street: 'Av. del Libertador 124', city: 'Alta Gracia, Córdoba', mapsUrl: null },
  contact: { whatsapp: '+54 9 3547 55-5124', phone: null },
  links: [{ network: 'instagram', handle: '@cafecentral.demo', url: 'https://instagram.com/cafecentral.demo' }],
  timezone: TIMEZONE,
  openingHours: WEEK,
};

describe('openStatusAt (venue local time, Córdoba is UTC-3)', () => {
  // 2026-10-26 is a Monday.
  it('is open inside today’s range and reports the closing time', () => {
    expect(openStatusAt(WEEK, TIMEZONE, new Date('2026-10-26T12:00:00Z'))).toEqual({ open: true, closesAt: '20:00' });
  });

  it('reports a later opening today before the venue opens', () => {
    expect(openStatusAt(WEEK, TIMEZONE, new Date('2026-10-26T10:30:00Z'))).toEqual({
      open: false,
      reopensOn: 'monday',
      reopensAt: '08:00',
    });
  });

  it('treats the closing minute as closed and points at the next open day', () => {
    expect(openStatusAt(WEEK, TIMEZONE, new Date('2026-10-26T23:00:00Z'))).toEqual({
      open: false,
      reopensOn: 'tuesday',
      reopensAt: '08:00',
    });
  });

  it('skips closed days (Saturday night → Monday)', () => {
    expect(openStatusAt(WEEK, TIMEZONE, new Date('2026-11-01T01:00:00Z'))).toEqual({
      open: false,
      reopensOn: 'monday',
      reopensAt: '08:00',
    });
  });

  it('has no status without published hours', () => {
    expect(openStatusAt([], TIMEZONE, new Date('2026-10-26T12:00:00Z'))).toBeNull();
  });
});

describe('venue profile rules', () => {
  it('accepts a valid profile', () => {
    expect(venueProfileIssues(PROFILE)).toEqual([]);
  });

  it('reports a blank name, an unknown timezone, duplicate networks and bad hours', () => {
    const profile: VenueProfile = {
      ...PROFILE,
      name: '  ',
      timezone: 'Mars/Olympus',
      links: [...PROFILE.links, { network: 'instagram', handle: '@otro', url: null }],
      openingHours: [
        { weekday: 'monday', opensAt: '20:00', closesAt: '08:00' },
        { weekday: 'monday', opensAt: '08:00', closesAt: '12:00' },
        { weekday: 'tuesday', opensAt: '24:00', closesAt: '25:00' },
      ],
    };
    expect(venueProfileIssues(profile)).toEqual([
      { path: 'name', code: 'required' },
      { path: 'timezone', code: 'invalid_timezone' },
      { path: 'links.1.network', code: 'duplicate' },
      { path: 'openingHours.0', code: 'closes_before_opens' },
      { path: 'openingHours.1.weekday', code: 'duplicate' },
      { path: 'openingHours.2', code: 'invalid_time' },
    ]);
  });

  it('trims text and turns blank optional values into null', () => {
    const normalized = normalizeVenueProfile({
      ...PROFILE,
      name: ' Café Central ',
      description: '   ',
      address: { street: ' Av. del Libertador 124 ', city: 'Alta Gracia', mapsUrl: ' ' },
      contact: { whatsapp: ' ', phone: ' +54 351 ' },
      links: [{ network: 'website', handle: ' cafecentral.demo ', url: '' }],
    });
    expect(normalized).toMatchObject({
      name: 'Café Central',
      description: null,
      address: { street: 'Av. del Libertador 124', city: 'Alta Gracia', mapsUrl: null },
      contact: { whatsapp: null, phone: '+54 351' },
      links: [{ network: 'website', handle: 'cafecentral.demo', url: null }],
    });
  });

  it('sorts opening hours by weekday', () => {
    const normalized = normalizeVenueProfile({ ...PROFILE, openingHours: [...WEEK].reverse() });
    expect(normalized.openingHours.map((hours) => hours.weekday)).toEqual(WEEK.map((hours) => hours.weekday));
  });
});
