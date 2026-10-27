import type {
  QrCredential,
  RevokedQrCredential,
  SpaceIcon,
  SpaceTone,
  TableLayout,
  VenueSpace,
  VenueTable,
} from "@/mocks/service-day";

/**
 * Maps the API table configuration (`TablesConfiguration` in `api/src/modules/tables`) to the
 * admin types the screens render: `issuedAt` → `generatedOn` (local "YYYY-MM-DD"),
 * `issuedBy.name` → `generatedBy`, `revokedAt` → `revokedOn`, `auditNumber` 118 → "QR-118".
 * Anything that does not match the contract makes the whole body invalid (`null`).
 */

export type VenueConfig = { spaces: VenueSpace[]; tables: VenueTable[] };

const SPACE_ICONS: readonly SpaceIcon[] = ["store", "sun", "trees", "map-pin"];
const SPACE_TONES: readonly SpaceTone[] = ["brand", "warning", "success", "neutral"];

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json => typeof value === "object" && value !== null;
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const pad = (value: number) => String(value).padStart(2, "0");

/** Local calendar date of an ISO timestamp ("2026-10-21T12:00:00.000Z" → "2026-10-21"). */
export function toLocalDate(iso: unknown): string | null {
  if (!isString(iso)) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Audit entry of a QR rotation as the screens show it (118 → "QR-118"). */
export const formatAuditId = (auditNumber: number) => `QR-${auditNumber}`;

function toSpace(value: unknown): VenueSpace | null {
  if (!isRecord(value)) return null;
  const { id, name, icon, tone } = value;
  if (!isString(id) || !isString(name)) return null;
  if (!SPACE_ICONS.includes(icon as SpaceIcon) || !SPACE_TONES.includes(tone as SpaceTone)) return null;
  return { id, name, icon: icon as SpaceIcon, tone: tone as SpaceTone };
}

function toCredential(value: unknown): QrCredential | null {
  if (!isRecord(value) || !isString(value.token) || !isRecord(value.issuedBy) || !isString(value.issuedBy.name)) return null;
  const generatedOn = toLocalDate(value.issuedAt);
  return generatedOn ? { token: value.token, generatedOn, generatedBy: value.issuedBy.name } : null;
}

function toRevokedCredential(value: unknown): RevokedQrCredential | null {
  const credential = toCredential(value);
  if (!credential || !isRecord(value) || !isNumber(value.auditNumber)) return null;
  const revokedOn = toLocalDate(value.revokedAt);
  return revokedOn ? { ...credential, revokedOn, auditId: formatAuditId(value.auditNumber) } : null;
}

function toLayout(value: unknown): TableLayout | null {
  if (!isRecord(value)) return null;
  const { x, y, width, height, shape } = value;
  if (![x, y, width, height].every(isNumber) || (shape !== "rect" && shape !== "round")) return null;
  return { x: x as number, y: y as number, width: width as number, height: height as number, shape };
}

function toTable(value: unknown): VenueTable | null {
  if (!isRecord(value)) return null;
  const { id, number, label, spaceId, capacity, description, enabled, version } = value;
  if (!isString(id) || !isNumber(number) || !isString(label) || !isString(spaceId) || !isNumber(capacity)) return null;
  if (!isString(description) || typeof enabled !== "boolean" || !isNumber(version)) return null;
  const layout = toLayout(value.layout);
  const qr = value.qr === null ? null : toCredential(value.qr);
  if (!layout || (value.qr !== null && !qr) || !Array.isArray(value.revokedQrs)) return null;
  const revokedQrs = value.revokedQrs.map(toRevokedCredential);
  if (revokedQrs.some((credential) => credential === null)) return null;
  return {
    id,
    number,
    label,
    spaceId,
    capacity,
    description,
    enabled,
    version,
    layout,
    qr,
    revokedQrs: revokedQrs as RevokedQrCredential[],
  };
}

export function toVenueConfig(body: unknown): VenueConfig | null {
  if (!isRecord(body) || !Array.isArray(body.spaces) || !Array.isArray(body.tables)) return null;
  const spaces = body.spaces.map(toSpace);
  const tables = body.tables.map(toTable);
  if (spaces.some((space) => space === null) || tables.some((table) => table === null)) return null;
  return { spaces: spaces as VenueSpace[], tables: tables as VenueTable[] };
}
