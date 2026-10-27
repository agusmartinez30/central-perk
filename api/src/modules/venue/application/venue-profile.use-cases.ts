import { openStatusAt } from '../domain/opening-hours.js';
import { InvalidVenueProfileError, VenueNotConfiguredError } from '../domain/venue-errors.js';
import { normalizeVenueProfile, venueProfileIssues, type PublicVenueProfile, type VenueProfile } from '../domain/venue-profile.js';
import type { VenueDeps } from './venue-deps.js';

function withOpenStatus(profile: VenueProfile, now: Date): PublicVenueProfile {
  return { ...profile, openStatus: openStatusAt(profile.openingHours, profile.timezone, now) };
}

/** Public profile for the web "Detalle del negocio" screen, with whether the venue is open now. */
export class GetVenueProfile {
  constructor(private readonly deps: VenueDeps) {}

  async execute(): Promise<PublicVenueProfile> {
    const profile = await this.deps.profiles.get();
    if (!profile) throw new VenueNotConfiguredError();
    return withOpenStatus(profile, this.deps.clock.now());
  }
}

/** Replaces the whole profile (admin). */
export class UpdateVenueProfile {
  constructor(private readonly deps: VenueDeps) {}

  async execute(input: VenueProfile): Promise<PublicVenueProfile> {
    const profile = normalizeVenueProfile(input);
    const issues = venueProfileIssues(profile);
    if (issues.length > 0) throw new InvalidVenueProfileError(issues);
    await this.deps.profiles.save(profile);
    return withOpenStatus(profile, this.deps.clock.now());
  }
}
