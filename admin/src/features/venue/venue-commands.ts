import type { TablesRequest } from "./tables-api";
import { getTableChanges, parseCapacity, type TableDraft } from "./table-config";
import type { VenueAction, VenueState } from "./venue-state";

/**
 * Translates a venue action into the tables API calls that perform it, in order. The API
 * validates every rule again and issues ids, numbers, versions and QR credentials.
 */

const id = (value: string) => `/${encodeURIComponent(value)}`;

function draftBody(draft: TableDraft) {
  return {
    label: draft.label.trim(),
    spaceId: draft.spaceId,
    // Validated client-side first; an unparsable value is sent as is for the API to refuse.
    capacity: parseCapacity(draft.capacity) ?? Number(draft.capacity.trim()),
    description: draft.description.trim(),
    enabled: draft.enabled,
  };
}

export function toTablesRequests(action: VenueAction, venue: VenueState): TablesRequest[] {
  switch (action.type) {
    case "save-space": {
      const body = { name: action.name.trim(), ...(action.icon && { icon: action.icon }), ...(action.tone && { tone: action.tone }) };
      return action.editingId
        ? [{ method: "PATCH", path: `/spaces${id(action.editingId)}`, body }]
        : [{ method: "POST", path: "/spaces", body }];
    }
    case "move-space":
      return [{ method: "POST", path: `/spaces${id(action.id)}/move`, body: { direction: action.direction < 0 ? "up" : "down" } }];
    case "delete-space":
      return [{ method: "DELETE", path: `/spaces${id(action.id)}` }];
    case "save-table": {
      const existing = action.editingId ? venue.tables.find((table) => table.id === action.editingId) : undefined;
      if (!existing) {
        return [{ method: "POST", path: "", body: { ...draftBody(action.draft), ...(action.shape && { shape: action.shape }) } }];
      }
      const requests: TablesRequest[] = [];
      if (getTableChanges(existing, action.draft).length > 0) {
        requests.push({ method: "PATCH", path: id(existing.id), body: draftBody(action.draft) });
      }
      if (action.shape && action.shape !== existing.layout.shape) {
        requests.push({ method: "PUT", path: `${id(existing.id)}/shape`, body: { shape: action.shape } });
      }
      return requests;
    }
    case "set-table-enabled":
      return [{ method: "POST", path: `${id(action.id)}/${action.enabled ? "enable" : "disable"}` }];
    case "delete-table":
      return [{ method: "DELETE", path: id(action.id) }];
    case "move-table":
      return [{ method: "PUT", path: `${id(action.id)}/position`, body: { x: action.x, y: action.y } }];
    case "resize-table": {
      const { x, y, width, height } = action;
      // The API stores the plan in whole units.
      const body = { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
      return [{ method: "PUT", path: `${id(action.id)}/size`, body }];
    }
    case "set-table-shape":
      return [{ method: "PUT", path: `${id(action.id)}/shape`, body: { shape: action.shape } }];
    case "regenerate-qr":
      return [{ method: "POST", path: `${id(action.id)}/qr/regenerate` }];
  }
}
