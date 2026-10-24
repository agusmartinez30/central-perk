import {
  deriveTable,
  type QrCredential,
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

function parseCapacity(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const capacity = Number(trimmed);
  return capacity >= CAPACITY_MIN && capacity <= CAPACITY_MAX ? capacity : null;
}

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
  if (label === "") errors.label = "Ingresá el nombre o número de la mesa.";
  else if (draft.label.trim().length > LABEL_MAX_LENGTH) errors.label = `Usá hasta ${LABEL_MAX_LENGTH} caracteres.`;
  else if (tables.some((table) => table.id !== editingId && normalize(table.label) === label)) {
    errors.label = "Ya existe una mesa con ese nombre.";
  }
  if (spaces && !spaces.some((space) => space.id === draft.spaceId)) errors.spaceId = "Elegí un espacio.";
  if (parseCapacity(draft.capacity) === null) {
    errors.capacity = `Ingresá un número entero entre ${CAPACITY_MIN} y ${CAPACITY_MAX}.`;
  }
  if (draft.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Usá hasta ${DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
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

export type CredentialContext = {
  /** ISO date of the service. */
  today: string;
  staffName: string;
  /** Issues a new token; the screen passes a unique, secure one. */
  createToken: () => string;
};

export function issueCredential({ today, staffName, createToken }: CredentialContext): QrCredential {
  return { token: createToken(), generatedOn: today, generatedBy: staffName };
}

/**
 * Saves a valid draft. An existing table keeps its id, number and credential and bumps its
 * version; a new one takes the next number, the `tbl_NN` id and a fresh credential.
 */
export function applyTableDraft(
  tables: readonly VenueTable[],
  editingId: string | null,
  draft: TableDraft,
  context: CredentialContext,
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
    qr: issueCredential(context),
    revokedQrs: [],
    layout: getFreeLayout(tables, fields.spaceId),
  };
  return { id: created.id, tables: [...tables, created] };
}

// Enable / disable

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
      reason: "No se puede deshabilitar mientras exista una cuenta activa.",
    };
  }
  return { enabled: true, label: "Deshabilitar mesa", allowed: true };
}

export function setTableEnabled(tables: readonly VenueTable[], id: string, enabled: boolean): readonly VenueTable[] {
  const target = tables.find((table) => table.id === id);
  if (!target || target.enabled === enabled) return tables;
  return tables.map((table) => (table.id === id ? { ...table, enabled, version: table.version + 1 } : table));
}
