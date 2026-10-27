import { normalizeName } from './normalize-name.js';
import type { QrCredential, RevokedQrCredential } from './qr-credential.js';
import type { Space } from './space.js';
import type { TableLayout } from './table-layout.js';

/** A physical table (admin 09B). Rules ported from `admin/src/features/venue/{table-config,table-removal}.ts`. */

export const TABLE_LABEL_MAX_LENGTH = 30;
export const TABLE_DESCRIPTION_MAX_LENGTH = 60;
export const TABLE_CAPACITY_MIN = 1;
export const TABLE_CAPACITY_MAX = 20;

export interface VenueTable {
  /** Internal id derived from the number ("tbl_07"). */
  id: string;
  /** Public identity used by the QR URL and the live screens; never reused. */
  number: number;
  label: string;
  spaceId: string;
  capacity: number;
  /** Internal note; empty when unset. */
  description: string;
  enabled: boolean;
  /** Bumped by every configuration change (display and audit only). */
  version: number;
  layout: TableLayout;
  /** Active credential; null when the table has none. */
  qr: QrCredential | null;
  /** Rotated credentials, newest first. */
  revokedQrs: RevokedQrCredential[];
}

/** Editable fields of a table (admin 09B form). */
export interface TableDraft {
  label: string;
  spaceId: string;
  capacity: number;
  description: string;
  enabled: boolean;
}

export type TableIssue =
  | { path: 'label'; code: 'required' | 'too_long' | 'duplicate' }
  | { path: 'spaceId'; code: 'unknown_space' }
  | { path: 'capacity'; code: 'out_of_range' }
  | { path: 'description'; code: 'too_long' };

export function normalizeTableDraft(draft: TableDraft): TableDraft {
  return { ...draft, label: draft.label.trim(), description: draft.description.trim() };
}

/** Unique label up to 30 characters, an existing space, an integer capacity from 1 to 20, a description up to 60. */
export function tableDraftIssues(
  draft: TableDraft,
  { spaces, tables }: { spaces: readonly Space[]; tables: readonly VenueTable[] },
  editingId: string | null,
): TableIssue[] {
  const issues: TableIssue[] = [];
  const label = normalizeName(draft.label);
  if (label === '') issues.push({ path: 'label', code: 'required' });
  else if (draft.label.trim().length > TABLE_LABEL_MAX_LENGTH) issues.push({ path: 'label', code: 'too_long' });
  else if (tables.some((table) => table.id !== editingId && normalizeName(table.label) === label)) {
    issues.push({ path: 'label', code: 'duplicate' });
  }
  if (!spaces.some((space) => space.id === draft.spaceId)) issues.push({ path: 'spaceId', code: 'unknown_space' });
  if (!Number.isInteger(draft.capacity) || draft.capacity < TABLE_CAPACITY_MIN || draft.capacity > TABLE_CAPACITY_MAX) {
    issues.push({ path: 'capacity', code: 'out_of_range' });
  }
  if (draft.description.trim().length > TABLE_DESCRIPTION_MAX_LENGTH) issues.push({ path: 'description', code: 'too_long' });
  return issues;
}

/** "tbl_07": numbers are never reused, so neither are ids. */
export function tableIdFor(number: number): string {
  return `tbl_${String(number).padStart(2, '0')}`;
}

/** Live facts about a table that come from its sessions. */
export interface TableActivitySnapshot {
  /** A session is open (seated or with a bill request). */
  openSession: boolean;
  /** The table ever had a session, open or closed. */
  hadSession: boolean;
}

/** Disabling is refused while a session is open; enabling is always allowed. */
export function disableBlock(activity: TableActivitySnapshot): 'table_has_open_session' | null {
  return activity.openSession ? 'table_has_open_session' : null;
}

/** A table can be deleted only when it never had a session (its history must be kept). */
export function removalBlock(activity: TableActivitySnapshot): 'table_has_open_session' | 'table_has_history' | null {
  if (activity.openSession) return 'table_has_open_session';
  return activity.hadSession ? 'table_has_history' : null;
}
