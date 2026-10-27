import { LAST_SPACE_REASON, SPACE_NAME_MESSAGES, getSpaceName, spaceWithTablesReason } from "./space-config";
import type { TablesApiError, TablesIssue } from "./tables-api";
import { QUICK_TOGGLE_OPEN_SESSION, TABLE_DRAFT_MESSAGES, type TableDraftErrors } from "./table-config";
import { historyReason, openSessionReason } from "./table-removal";
import type { VenueAction, VenueState } from "./venue-state";

/**
 * Spanish copy for API refusals. It reuses the messages the screens already show for the same
 * client-side rules, so a refusal reads the same whichever side caught it.
 */

/** Same copy as the auth screens when the API cannot be reached. */
export const VENUE_UNAVAILABLE = "No pudimos conectarnos con el servidor. Probá de nuevo en unos segundos.";

const NOT_FOUND = "Esa mesa o espacio ya no existe. Recargá la página para ver la configuración actual.";

const tableLabel = (venue: VenueState, id: string) => venue.tables.find((table) => table.id === id)?.label ?? "La mesa";

const targetId = (action: VenueAction): string | null =>
  action.type === "save-space" || action.type === "save-table" ? action.editingId : action.id;

export function describeVenueError(error: TablesApiError, action: VenueAction, venue: VenueState): string {
  switch (error.kind) {
    case "network":
    case "unknown":
    case "unauthorized":
      return VENUE_UNAVAILABLE;
    case "not-found":
      return NOT_FOUND;
    case "invalid":
      if (action.type === "save-table") return "Revisá los datos marcados.";
      if (action.type === "save-space") return "Revisá el nombre del espacio.";
      return VENUE_UNAVAILABLE;
  }
  const id = targetId(action) ?? "";
  switch (error.code) {
    case "space_not_removable":
      return error.reason === "last_space" ? LAST_SPACE_REASON : spaceWithTablesReason(getSpaceName(venue.spaces, id), error.tableCount);
    case "table_has_open_session":
      return action.type === "set-table-enabled" ? QUICK_TOGGLE_OPEN_SESSION : openSessionReason(tableLabel(venue, id));
    case "table_has_history":
      return historyReason(tableLabel(venue, id));
    case "table_overlap": {
      const where = action.type === "resize-table" ? "no entra con ese tamaño" : "no entra ahí";
      return `${tableLabel(venue, id)} ${where}: se superpone con ${error.conflict.label}.`;
    }
  }
}

const TABLE_ISSUES: Record<string, Partial<Record<string, string>>> = {
  label: {
    required: TABLE_DRAFT_MESSAGES.labelRequired,
    too_long: TABLE_DRAFT_MESSAGES.labelTooLong,
    duplicate: TABLE_DRAFT_MESSAGES.labelDuplicate,
  },
  spaceId: { unknown_space: TABLE_DRAFT_MESSAGES.unknownSpace },
  capacity: { out_of_range: TABLE_DRAFT_MESSAGES.capacity },
  description: { too_long: TABLE_DRAFT_MESSAGES.descriptionTooLong },
};

/** Field errors of the table form for the API's `issues`. */
export function tableIssueErrors(issues: readonly TablesIssue[]): TableDraftErrors {
  const errors: TableDraftErrors = {};
  for (const { path, code } of issues) {
    const message = TABLE_ISSUES[path]?.[code];
    if (message && (path === "label" || path === "spaceId" || path === "capacity" || path === "description")) errors[path] = message;
  }
  return errors;
}

const SPACE_ISSUES: Partial<Record<string, string>> = {
  required: SPACE_NAME_MESSAGES.required,
  too_long: SPACE_NAME_MESSAGES.tooLong,
  duplicate: SPACE_NAME_MESSAGES.duplicate,
};

/** Name error of the space form for the API's `issues`, if any. */
export function spaceIssueError(issues: readonly TablesIssue[]): string | null {
  const issue = issues.find(({ path, code }) => path === "name" && SPACE_ISSUES[code]);
  return issue ? (SPACE_ISSUES[issue.code] ?? null) : null;
}
