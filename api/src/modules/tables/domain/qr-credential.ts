/**
 * Public QR credential of a table: the token its printed code carries (`?mesa=07&qr=<token>`).
 * Rotating it revokes the old token with an audit number; tokens are never reused.
 */

export const QR_TOKEN_LENGTH = 10;
export const QR_TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Staff member who issued a credential. */
export interface StaffRef {
  id: string;
  name: string;
}

export interface QrCredential {
  token: string;
  issuedAt: Date;
  issuedBy: StaffRef;
}

/** A rotated credential: its printed code no longer resolves the table. */
export interface RevokedQrCredential extends QrCredential {
  revokedAt: Date;
  /** Audit entry of the rotation ("QR-118" in the admin). */
  auditNumber: number;
}

/** Tables with a credential to rotate. */
interface WithCredentials {
  qr: QrCredential | null;
  revokedQrs: RevokedQrCredential[];
}

/** Revokes the active credential (newest first in the history) and makes `issued` the active one. */
export function rotateCredential<Table extends WithCredentials>(
  table: Table,
  issued: QrCredential,
  revokedAt: Date,
  auditNumber: number,
): Table {
  const revokedQrs = table.qr ? [{ ...table.qr, revokedAt, auditNumber }, ...table.revokedQrs] : table.revokedQrs;
  return { ...table, qr: issued, revokedQrs };
}
