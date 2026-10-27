import { normalizeName } from './normalize-name.js';

/** Areas of the venue where tables are placed (admin 09A "Espacios"). Rules ported from `admin/src/features/venue/space-config.ts`. */

export const SPACE_ICONS = ['store', 'sun', 'trees', 'map-pin'] as const;
export type SpaceIcon = (typeof SPACE_ICONS)[number];

export const SPACE_TONES = ['brand', 'warning', 'success', 'neutral'] as const;
export type SpaceTone = (typeof SPACE_TONES)[number];

export const SPACE_NAME_MAX_LENGTH = 24;

export interface Space {
  /** Slug of the first name ("barra-alta"); it never changes on rename. */
  id: string;
  name: string;
  icon: SpaceIcon;
  tone: SpaceTone;
}

export interface SpaceDraft {
  name: string;
  icon?: SpaceIcon;
  tone?: SpaceTone;
}

/** New spaces get the map-pin icon on the neutral wash unless a style is chosen. */
export const DEFAULT_SPACE_STYLE = { icon: 'map-pin', tone: 'neutral' } as const satisfies Pick<Space, 'icon' | 'tone'>;

export type SpaceDirection = 'up' | 'down';

export type SpaceIssue = { path: 'name'; code: 'required' | 'too_long' | 'duplicate' };

/** Unique (ignoring case, spaces and accents), non-empty name of up to 24 characters. */
export function spaceNameIssues(name: string, spaces: readonly Space[], editingId: string | null): SpaceIssue[] {
  const normalized = normalizeName(name);
  if (normalized === '') return [{ path: 'name', code: 'required' }];
  if (name.trim().length > SPACE_NAME_MAX_LENGTH) return [{ path: 'name', code: 'too_long' }];
  if (spaces.some((space) => space.id !== editingId && normalizeName(space.name) === normalized)) {
    return [{ path: 'name', code: 'duplicate' }];
  }
  return [];
}

/** Slug of the name ("Barra alta" → "barra-alta"), suffixed when taken ("salon-2"). */
export function createSpaceId(name: string, spaces: readonly Space[]): string {
  const base =
    normalizeName(name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'espacio';
  const taken = new Set(spaces.map((space) => space.id));
  let id = base;
  for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`;
  return id;
}

/** Moves a space one place earlier or later; the same list when it is already at that end. */
export function moveSpace(spaces: readonly Space[], id: string, direction: SpaceDirection): readonly Space[] {
  const index = spaces.findIndex((space) => space.id === id);
  const target = index + (direction === 'up' ? -1 : 1);
  const moved = spaces[index];
  const swapped = spaces[target];
  if (index < 0 || !moved || !swapped) return spaces;
  const next = [...spaces];
  next[index] = swapped;
  next[target] = moved;
  return next;
}

export type SpaceRemovalBlock = 'space_has_tables' | 'last_space';

/** A space can be deleted only when it has no tables and is not the last one. */
export function spaceRemovalBlock(
  spaces: readonly Space[],
  tables: readonly { spaceId: string }[],
  id: string,
): SpaceRemovalBlock | null {
  if (tables.some((table) => table.spaceId === id)) return 'space_has_tables';
  if (spaces.length <= 1) return 'last_space';
  return null;
}
