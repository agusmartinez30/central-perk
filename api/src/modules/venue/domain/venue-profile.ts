import {
  isValidTimeZone,
  openingHoursIssues,
  sortOpeningHours,
  type OpeningHours,
  type OpeningHoursIssue,
  type OpenStatus,
} from './opening-hours.js';

/** Public café profile shown on the web "Detalle del negocio" screen (`web/src/features/cafe-info`). */

export const LINK_NETWORKS = ['instagram', 'facebook', 'website'] as const;
export type LinkNetwork = (typeof LINK_NETWORKS)[number];

export interface VenueLink {
  network: LinkNetwork;
  /** Visible handle or short label, e.g. "@cafecentral.demo". */
  handle: string;
  /** `null` while the profile is not available (the row renders dimmed). */
  url: string | null;
}

export interface VenueAddress {
  street: string;
  /** City line shown under the street. */
  city: string;
  mapsUrl: string | null;
}

/** Published phone numbers; `null` when the channel is not available. */
export interface VenueContact {
  whatsapp: string | null;
  phone: string | null;
}

export interface VenueProfile {
  name: string;
  description: string | null;
  /** Absolute URL or a path served by the web app. */
  coverImageUrl: string;
  address: VenueAddress | null;
  contact: VenueContact;
  links: VenueLink[];
  /** IANA time zone the opening hours are expressed in. */
  timezone: string;
  openingHours: OpeningHours[];
}

export type PublicVenueProfile = VenueProfile & { openStatus: OpenStatus | null };

export type VenueProfileIssue = { path: string; code: 'required' | 'invalid_timezone' | OpeningHoursIssue['code'] };

/** Trimmed text, or `null` when blank. */
function optionalText(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeVenueProfile(profile: VenueProfile): VenueProfile {
  const { address, contact } = profile;
  return {
    name: profile.name.trim(),
    description: optionalText(profile.description),
    coverImageUrl: profile.coverImageUrl.trim(),
    address: address && {
      street: address.street.trim(),
      city: address.city.trim(),
      mapsUrl: optionalText(address.mapsUrl),
    },
    contact: { whatsapp: optionalText(contact.whatsapp), phone: optionalText(contact.phone) },
    links: profile.links.map((link) => ({ network: link.network, handle: link.handle.trim(), url: optionalText(link.url) })),
    timezone: profile.timezone.trim(),
    openingHours: sortOpeningHours(profile.openingHours),
  };
}

/** Rules a (normalized) profile must meet before it is saved. */
export function venueProfileIssues(profile: VenueProfile): VenueProfileIssue[] {
  const issues: VenueProfileIssue[] = [];
  if (!profile.name.trim()) issues.push({ path: 'name', code: 'required' });
  if (!profile.coverImageUrl.trim()) issues.push({ path: 'coverImageUrl', code: 'required' });
  if (profile.address && (!profile.address.street.trim() || !profile.address.city.trim()))
    issues.push({ path: 'address', code: 'required' });
  if (!isValidTimeZone(profile.timezone)) issues.push({ path: 'timezone', code: 'invalid_timezone' });

  const networks = new Set<LinkNetwork>();
  profile.links.forEach((link, index) => {
    if (networks.has(link.network)) issues.push({ path: `links.${index}.network`, code: 'duplicate' });
    networks.add(link.network);
    if (!link.handle.trim()) issues.push({ path: `links.${index}.handle`, code: 'required' });
  });

  return [...issues, ...openingHoursIssues(profile.openingHours)];
}

/** Single-venue store for the profile. */
export interface VenueProfileRepository {
  /** `null` until the venue is seeded or first saved. */
  get(): Promise<VenueProfile | null>;
  save(profile: VenueProfile): Promise<void>;
}
