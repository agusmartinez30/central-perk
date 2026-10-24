import type { SpaceId, VenueSpace, VenueTable } from "@/mocks/service-day";
import { normalizeName as normalize } from "@/features/venue/normalize";
import { getSpaceName } from "@/features/venue/space-config";
import {
  SESSION_STATUS_LABELS,
  formatCapacity,
  issueCredential,
  type CredentialContext,
  type SessionStatus,
} from "@/features/venue/table-config";

/** "QR activo"; "QR pausado" (disabled table) and "Sin QR" are invented labels. */
export type QrStatus = "active" | "paused" | "missing";

export const QR_STATUS_LABELS: Record<QrStatus, string> = {
  active: "QR activo",
  paused: "QR pausado",
  missing: "Sin QR",
};

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
