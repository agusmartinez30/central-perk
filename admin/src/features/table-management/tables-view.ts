import { parseScreenState } from "@/shared/lib/screen-state";
import { TABLE_QR_FORCED_STATES } from "@/features/table-qr/table-qr-state";

/** Tabs of Gestión de mesas: "Plano" (spaces and floor plan) and "Códigos QR" (`?view=qr`). */
export const TABLES_VIEWS = ["plan", "qr"] as const;

export type TablesView = (typeof TABLES_VIEWS)[number];

const TABLE_MANAGEMENT_PATH = "/tables/management";

/** The tab `?view=` opens; anything but `qr` is the plan. */
export function parseTablesView(value: string | null | undefined): TablesView {
  return parseScreenState(value, TABLES_VIEWS) ?? "plan";
}

/** URL of a tab, without the deep links (`?table=`, `?space=`, `?state=`) of the other one. */
export function getTablesViewHref(view: TablesView): string {
  return view === "qr" ? `${TABLE_MANAGEMENT_PATH}?view=qr` : TABLE_MANAGEMENT_PATH;
}

/** Old `/tables/qr?state=` values of table and space editing, now forced states of the plan. */
const MOVED_STATES = {
  edit: "table-edit",
  new: "table-new",
  errors: "errors",
  "space-edit": "space-edit",
  "space-new": "space-new",
} as const;

const MOVED_STATE_IDS = Object.keys(MOVED_STATES) as (keyof typeof MOVED_STATES)[];

/**
 * Where the former `/tables/qr` screen sends its visitors: the "Códigos QR" tab, keeping its
 * forced states, or the plan for the editing states that moved there. Unknown states are dropped.
 */
export function getLegacyQrRedirect(state: string | string[] | undefined): string {
  const value = Array.isArray(state) ? state[0] : state;
  const moved = parseScreenState(value, MOVED_STATE_IDS);
  if (moved) return `${TABLE_MANAGEMENT_PATH}?state=${MOVED_STATES[moved]}`;
  const forced = parseScreenState(value, TABLE_QR_FORCED_STATES);
  const qr = getTablesViewHref("qr");
  return forced ? `${qr}&state=${forced}` : qr;
}
