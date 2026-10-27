import {
  deriveTable,
  type ServiceDay,
  type SpaceId,
  type VenueSpace,
  type VenueTable,
} from "@/mocks/service-day";
import { normalizeName as normalize } from "./normalize";
import { getFreeLayout } from "./table-layout";

/** 09A "SESIÓN": the live state of the table's open session. */
export type SessionStatus = "available" | "occupied" | "bill-requested";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  "bill-requested": "Cuenta solicitada",
};

const pad = (value: number) => String(value).padStart(2, "0");

/** Session status by table number, derived like the 02 board (bill request > seated > free). */
export function getSessionStatuses(day: ServiceDay): Record<number, SessionStatus> {
  const statuses: Record<number, SessionStatus> = {};
  for (const table of day.tables) {
    const { status } = deriveTable(day, table.number);
    statuses[table.number] = status === "available" ? "available" : status === "bill-requested" ? "bill-requested" : "occupied";
  }
  return statuses;
}

/** "4 personas". */
export function formatCapacity(capacity: number): string {
  return `${capacity} ${capacity === 1 ? "persona" : "personas"}`;
}

// 09B · Crear y editar mesa

export type TableDraft = {
  label: string;
  spaceId: SpaceId;
  /** Raw input; validated as an integer. */
  capacity: string;
  description: string;
  enabled: boolean;
};

export type TableDraftField = keyof TableDraft;
export type TableDraftErrors = Partial<Record<"label" | "spaceId" | "capacity" | "description", string>>;

export const LABEL_MAX_LENGTH = 30;
export const DESCRIPTION_MAX_LENGTH = 60;
export const CAPACITY_MIN = 1;
export const CAPACITY_MAX = 20;

export function toTableDraft(table: VenueTable): TableDraft {
  return {
    label: table.label,
    spaceId: table.spaceId,
    capacity: String(table.capacity),
    description: table.description,
    enabled: table.enabled,
  };
}

/** Numbers are never reused: the next table gets one above the highest. */
export function nextTableNumber(tables: readonly VenueTable[]): number {
  return tables.reduce((max, table) => Math.max(max, table.number), 0) + 1;
}

/** Stable id a new table will get when saved ("tbl_13"). */
export function nextTableId(tables: readonly VenueTable[]): string {
  return `tbl_${pad(nextTableNumber(tables))}`;
}

/** New table form: the next number as its label, the first space, 4 seats (invented defaults), enabled. */
export function createEmptyTableDraft(tables: readonly VenueTable[], spaces: readonly VenueSpace[]): TableDraft {
  return {
    label: `Mesa ${pad(nextTableNumber(tables))}`,
    spaceId: spaces[0]?.id ?? "",
    capacity: "4",
    description: "",
    enabled: true,
  };
}

/** The draft's capacity as an integer within range, or `null`. */
export function parseCapacity(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const capacity = Number(trimmed);
  return capacity >= CAPACITY_MIN && capacity <= CAPACITY_MAX ? capacity : null;
}

/** Field messages of the 09B form, shared by the client rules and the API's `issues`. */
export const TABLE_DRAFT_MESSAGES = {
  labelRequired: "Ingresá el nombre o número de la mesa.",
  labelTooLong: `Usá hasta ${LABEL_MAX_LENGTH} caracteres.`,
  labelDuplicate: "Ya existe una mesa con ese nombre.",
  unknownSpace: "Elegí un espacio.",
  capacity: `Ingresá un número entero entre ${CAPACITY_MIN} y ${CAPACITY_MAX}.`,
  descriptionTooLong: `Usá hasta ${DESCRIPTION_MAX_LENGTH} caracteres.`,
} as const;

/** "Identificador único dentro del negocio" and "Capacidad: entero positivo" (messages invented). */
export function validateTableDraft(
  draft: TableDraft,
  tables: readonly VenueTable[],
  editingId: string | null,
  /** When given, the draft's space must be one of them. */
  spaces?: readonly VenueSpace[],
): TableDraftErrors {
  const errors: TableDraftErrors = {};
  const label = normalize(draft.label);
  if (label === "") errors.label = TABLE_DRAFT_MESSAGES.labelRequired;
  else if (draft.label.trim().length > LABEL_MAX_LENGTH) errors.label = TABLE_DRAFT_MESSAGES.labelTooLong;
  else if (tables.some((table) => table.id !== editingId && normalize(table.label) === label)) {
    errors.label = TABLE_DRAFT_MESSAGES.labelDuplicate;
  }
  if (spaces && !spaces.some((space) => space.id === draft.spaceId)) errors.spaceId = TABLE_DRAFT_MESSAGES.unknownSpace;
  if (parseCapacity(draft.capacity) === null) errors.capacity = TABLE_DRAFT_MESSAGES.capacity;
  if (draft.description.trim().length > DESCRIPTION_MAX_LENGTH) errors.description = TABLE_DRAFT_MESSAGES.descriptionTooLong;
  return errors;
}

const FIELDS: readonly TableDraftField[] = ["label", "spaceId", "capacity", "description", "enabled"];

function comparable(draft: TableDraft): Record<TableDraftField, string | boolean> {
  const capacity = parseCapacity(draft.capacity);
  return {
    label: draft.label.trim(),
    spaceId: draft.spaceId,
    capacity: capacity === null ? draft.capacity.trim() : String(capacity),
    description: draft.description.trim(),
    enabled: draft.enabled,
  };
}

/** Fields that differ from the saved table (every field for a new one). */
export function getTableChanges(table: VenueTable | null, draft: TableDraft): TableDraftField[] {
  if (!table) return [...FIELDS];
  const saved = comparable(toTableDraft(table));
  const edited = comparable(draft);
  return FIELDS.filter((field) => saved[field] !== edited[field]);
}

/**
 * Local preview of saving a valid draft (the API decides). An existing table keeps its id,
 * number and credential and bumps its version; a new one takes the next number and the
 * `tbl_NN` id, with no credential: the API issues its QR token.
 */
export function applyTableDraft(
  tables: readonly VenueTable[],
  editingId: string | null,
  draft: TableDraft,
): { tables: VenueTable[]; id: string } {
  const fields = {
    label: draft.label.trim(),
    spaceId: draft.spaceId,
    capacity: parseCapacity(draft.capacity) ?? CAPACITY_MIN,
    description: draft.description.trim(),
    enabled: draft.enabled,
  };
  const existing = editingId ? tables.find((table) => table.id === editingId) : undefined;
  if (existing) {
    const layout =
      existing.spaceId === fields.spaceId
        ? existing.layout
        : getFreeLayout(
            tables.filter((table) => table.id !== existing.id),
            fields.spaceId,
          );
    return {
      id: existing.id,
      tables: tables.map((table) =>
        table.id === existing.id ? { ...table, ...fields, layout, version: table.version + 1 } : table,
      ),
    };
  }
  const number = nextTableNumber(tables);
  const created: VenueTable = {
    id: `tbl_${pad(number)}`,
    number,
    ...fields,
    version: 1,
    qr: null,
    revokedQrs: [],
    layout: getFreeLayout(tables, fields.spaceId),
  };
  return { id: created.id, tables: [...tables, created] };
}

// Enable / disable

export const QUICK_TOGGLE_OPEN_SESSION = "No se puede deshabilitar mientras exista una cuenta activa.";

export type QuickToggle = { enabled: boolean; label: string; allowed: boolean; reason?: string };

/**
 * Row quick action. 09B: "La mesa no puede deshabilitarse desde la acción rápida mientras
 * exista una cuenta activa"; enabling is always allowed.
 */
export function getQuickToggle(table: VenueTable, session: SessionStatus): QuickToggle {
  if (!table.enabled) return { enabled: false, label: "Habilitar mesa", allowed: true };
  if (session !== "available") {
    return {
      enabled: true,
      label: "Deshabilitar mesa",
      allowed: false,
      reason: QUICK_TOGGLE_OPEN_SESSION,
    };
  }
  return { enabled: true, label: "Deshabilitar mesa", allowed: true };
}

export function setTableEnabled(tables: readonly VenueTable[], id: string, enabled: boolean): readonly VenueTable[] {
  const target = tables.find((table) => table.id === id);
  if (!target || target.enabled === enabled) return tables;
  return tables.map((table) => (table.id === id ? { ...table, enabled, version: table.version + 1 } : table));
}
