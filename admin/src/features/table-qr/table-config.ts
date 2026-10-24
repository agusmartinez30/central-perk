import {
  deriveTable,
  type QrCredential,
  type ServiceDay,
  type SpaceId,
  type VenueSpace,
  type VenueTable,
} from "@/mocks/service-day";
import { getSpaceName } from "./space-config";

/** 09A "SESIÓN": the live state of the table's open session. */
export type SessionStatus = "available" | "occupied" | "bill-requested";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  available: "Disponible",
  occupied: "Ocupada",
  "bill-requested": "Cuenta solicitada",
};

/** "QR activo"; "QR pausado" (disabled table) and "Sin QR" are invented labels. */
export type QrStatus = "active" | "paused" | "missing";

export const QR_STATUS_LABELS: Record<QrStatus, string> = {
  active: "QR activo",
  paused: "QR pausado",
  missing: "Sin QR",
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

export function getQrStatus(table: VenueTable): QrStatus {
  if (!table.qr) return "missing";
  return table.enabled ? "active" : "paused";
}

export type TableRow = {
  id: string;
  number: number;
  label: string;
  spaceId: SpaceId;
  spaceName: string;
  capacityLabel: string;
  configuration: { enabled: boolean; label: string };
  session: { status: SessionStatus; label: string };
  qr: { status: QrStatus; label: string };
};

/** 09A "Table Configuration List" rows, by table number. */
export function getTableRows(
  tables: readonly VenueTable[],
  sessions: Record<number, SessionStatus>,
  spaces: readonly VenueSpace[],
): TableRow[] {
  return [...tables]
    .sort((a, b) => a.number - b.number)
    .map((table) => {
      const session = sessions[table.number] ?? "available";
      const qr = getQrStatus(table);
      return {
        id: table.id,
        number: table.number,
        label: table.label,
        spaceId: table.spaceId,
        spaceName: getSpaceName(spaces, table.spaceId),
        capacityLabel: formatCapacity(table.capacity),
        configuration: { enabled: table.enabled, label: table.enabled ? "Habilitada" : "Deshabilitada" },
        session: { status: session, label: SESSION_STATUS_LABELS[session] },
        qr: { status: qr, label: QR_STATUS_LABELS[qr] },
      };
    });
}

export type TableMetrics = { total: number; enabled: number; withoutQr: number; disabled: number };

/** 09A "Mesas totales", "Habilitadas", "Sin QR", "Deshabilitadas". */
export function getTableMetrics(tables: readonly VenueTable[]): TableMetrics {
  const enabled = tables.filter((table) => table.enabled).length;
  return {
    total: tables.length,
    enabled,
    withoutQr: tables.filter((table) => !table.qr).length,
    disabled: tables.length - enabled,
  };
}

export type SpaceFilter = "all" | SpaceId;
export type ConfigurationFilter = "all" | "enabled" | "disabled";
export type TableRowQuery = { query: string; spaceId: SpaceFilter; configuration: ConfigurationFilter };

export const CONFIGURATION_FILTERS: readonly { id: ConfigurationFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "enabled", label: "Habilitadas" },
  { id: "disabled", label: "Deshabilitadas" },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

function matchesQuery(row: TableRow, query: string): boolean {
  if (query === "") return true;
  if (normalize(row.label).includes(query)) return true;
  // "mesa 7" or "7" finds Mesa 07 even without the leading zero.
  const digits = query.replace(/^mesa\s*/, "");
  return /^\d+$/.test(digits) && Number(digits) === row.number;
}

/** "Buscar número de mesa…", "Espacio" and "Configuración". */
export function filterTableRows(rows: readonly TableRow[], { query, spaceId, configuration }: TableRowQuery): TableRow[] {
  const normalized = normalize(query);
  return rows.filter(
    (row) =>
      (spaceId === "all" || row.spaceId === spaceId) &&
      (configuration === "all" || row.configuration.enabled === (configuration === "enabled")) &&
      matchesQuery(row, normalized),
  );
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

function issueCredential({ today, staffName, createToken }: CredentialContext): QrCredential {
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
    return {
      id: existing.id,
      tables: tables.map((table) => (table.id === existing.id ? { ...table, ...fields, version: table.version + 1 } : table)),
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

export function setTableEnabled(tables: VenueTable[], id: string, enabled: boolean): VenueTable[] {
  const target = tables.find((table) => table.id === id);
  if (!target || target.enabled === enabled) return tables;
  return tables.map((table) => (table.id === id ? { ...table, enabled, version: table.version + 1 } : table));
}

// 09F · Regenerar código QR

/** Next audit entry after the highest recorded rotation ("QR-118" → "QR-119"). */
export function nextAuditId(tables: readonly VenueTable[]): string {
  const highest = tables
    .flatMap((table) => table.revokedQrs)
    .reduce((max, credential) => Math.max(max, Number(credential.auditId.replace(/\D/g, "")) || 0), 0);
  return `QR-${highest + 1}`;
}

/** Revokes the active token (its printed code stops working) and issues a new one. */
export function regenerateTableQr(tables: VenueTable[], id: string, context: CredentialContext): VenueTable[] {
  const auditId = nextAuditId(tables);
  return tables.map((table) => {
    if (table.id !== id) return table;
    const revokedQrs = table.qr
      ? [{ ...table.qr, revokedOn: context.today, auditId }, ...table.revokedQrs]
      : table.revokedQrs;
    return { ...table, qr: issueCredential(context), revokedQrs, version: table.version + 1 };
  });
}

/** Every token the venue has used, so a new one never repeats a revoked code. */
export function getUsedTokens(tables: readonly VenueTable[]): string[] {
  return tables.flatMap((table) => [
    ...(table.qr ? [table.qr.token] : []),
    ...table.revokedQrs.map((credential) => credential.token),
  ]);
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "hoy" or "12 jun". */
export function formatCredentialDate(isoDate: string, today: string): string {
  if (isoDate === today) return "hoy";
  const [, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

export type CredentialHistoryRow = { key: string; status: "active" | "revoked"; label: string; meta: string };

/** 09C "HISTORIAL DE CREDENCIALES": the active credential, then the rotated ones. */
export function getCredentialHistory(table: VenueTable, today: string): CredentialHistoryRow[] {
  const rows: CredentialHistoryRow[] = [];
  if (table.qr) {
    rows.push({
      key: table.qr.token,
      status: "active",
      label: "Activo",
      meta: `Generado ${formatCredentialDate(table.qr.generatedOn, today)} · ${table.qr.generatedBy}`,
    });
  }
  for (const credential of table.revokedQrs) {
    rows.push({
      key: credential.token,
      status: "revoked",
      label: "Revocado",
      meta: `Rotado ${formatCredentialDate(credential.revokedOn, today)} · auditoría #${credential.auditId}`,
    });
  }
  return rows;
}
