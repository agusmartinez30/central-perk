import type { SpaceIcon, SpaceId, SpaceTone, VenueSpace, VenueTable } from "@/mocks/service-day";
import { normalizeName as normalize } from "./normalize";

export const SPACE_NAME_MAX_LENGTH = 24;

/** Shown for a table whose space no longer exists (never happens with the seeded data). */
export const UNKNOWN_SPACE_NAME = "Sin espacio";

export function getSpaceName(spaces: readonly VenueSpace[], id: SpaceId): string {
  return spaces.find((space) => space.id === id)?.name ?? UNKNOWN_SPACE_NAME;
}

export type SpaceCard = {
  id: SpaceId;
  name: string;
  icon: SpaceIcon;
  tone: SpaceTone;
  tableCount: number;
  /** 09A "Space Table Count": "5 mesas". */
  countLabel: string;
};

/** 09A "Space Cards": every space with the number of tables assigned to it. */
export function getSpaceCards(spaces: readonly VenueSpace[], tables: readonly VenueTable[]): SpaceCard[] {
  return spaces.map((space) => {
    const tableCount = tables.filter((table) => table.spaceId === space.id).length;
    return { ...space, tableCount, countLabel: `${tableCount} ${tableCount === 1 ? "mesa" : "mesas"}` };
  });
}

/** Unique, non-empty name up to 24 characters (messages invented). */
export function validateSpaceName(name: string, spaces: readonly VenueSpace[], editingId: SpaceId | null): string | null {
  const normalized = normalize(name);
  if (normalized === "") return "Ingresá el nombre del espacio.";
  if (name.trim().length > SPACE_NAME_MAX_LENGTH) return `Usá hasta ${SPACE_NAME_MAX_LENGTH} caracteres.`;
  if (spaces.some((space) => space.id !== editingId && normalize(space.name) === normalized)) {
    return "Ese espacio ya existe.";
  }
  return null;
}

/** Slug of the name ("Barra alta" → "barra-alta"), suffixed when taken ("salon-2"). */
export function createSpaceId(name: string, spaces: readonly VenueSpace[]): SpaceId {
  const base = normalize(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "espacio";
  const taken = new Set(spaces.map((space) => space.id));
  let id = base;
  for (let suffix = 2; taken.has(id); suffix += 1) id = `${base}-${suffix}`;
  return id;
}

export type SpaceStyle = { icon: SpaceIcon; tone: SpaceTone };

/** New spaces get the map-pin icon on the neutral wash unless a style is chosen. */
export const DEFAULT_SPACE_STYLE: SpaceStyle = { icon: "map-pin", tone: "neutral" };

/** Renames (and optionally restyles) a space keeping its id, or creates one. */
export function saveSpace(
  spaces: readonly VenueSpace[],
  editingId: SpaceId | null,
  name: string,
  style?: SpaceStyle,
): { spaces: VenueSpace[]; id: SpaceId } {
  const trimmed = name.trim();
  if (editingId && spaces.some((space) => space.id === editingId)) {
    return {
      id: editingId,
      spaces: spaces.map((space) => (space.id === editingId ? { ...space, ...style, name: trimmed } : space)),
    };
  }
  const id = createSpaceId(trimmed, spaces);
  return { id, spaces: [...spaces, { id, name: trimmed, ...(style ?? DEFAULT_SPACE_STYLE) }] };
}

/** Moves a space one place earlier (-1) or later (1) in the tabs and filters. */
export function moveSpace(spaces: readonly VenueSpace[], id: SpaceId, direction: -1 | 1): readonly VenueSpace[] {
  const index = spaces.findIndex((space) => space.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= spaces.length) return spaces;
  const next = [...spaces];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export type SpaceRemoval = { allowed: true } | { allowed: false; reason: string };

/** A space can be deleted only when it has no tables and is not the last one (messages invented). */
export function getSpaceRemoval(spaces: readonly VenueSpace[], tables: readonly VenueTable[], id: SpaceId): SpaceRemoval {
  const count = tables.filter((table) => table.spaceId === id).length;
  if (count > 0) {
    const name = getSpaceName(spaces, id);
    return {
      allowed: false,
      reason: `${name} tiene ${count} ${count === 1 ? "mesa" : "mesas"}. Mové o eliminá sus mesas antes de eliminar el espacio.`,
    };
  }
  if (spaces.length <= 1) return { allowed: false, reason: "El local necesita al menos un espacio." };
  return { allowed: true };
}

export function deleteSpace(spaces: readonly VenueSpace[], tables: readonly VenueTable[], id: SpaceId): readonly VenueSpace[] {
  if (!spaces.some((space) => space.id === id) || !getSpaceRemoval(spaces, tables, id).allowed) return spaces;
  return spaces.filter((space) => space.id !== id);
}
