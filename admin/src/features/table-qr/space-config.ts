import type { SpaceIcon, SpaceId, SpaceTone, VenueSpace, VenueTable } from "@/mocks/service-day";

export const SPACE_NAME_MAX_LENGTH = 24;

/** Shown for a table whose space no longer exists (never happens with the seeded data). */
export const UNKNOWN_SPACE_NAME = "Sin espacio";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

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

/** Renames a space (keeping id, icon and tone) or creates one with the default map-pin icon. */
export function saveSpace(
  spaces: readonly VenueSpace[],
  editingId: SpaceId | null,
  name: string,
): { spaces: VenueSpace[]; id: SpaceId } {
  const trimmed = name.trim();
  if (editingId && spaces.some((space) => space.id === editingId)) {
    return { id: editingId, spaces: spaces.map((space) => (space.id === editingId ? { ...space, name: trimmed } : space)) };
  }
  const id = createSpaceId(trimmed, spaces);
  return { id, spaces: [...spaces, { id, name: trimmed, icon: "map-pin", tone: "neutral" }] };
}
