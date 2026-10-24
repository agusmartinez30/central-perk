import { SERVICE_DAY, type ServiceDay, type SpaceIcon, type SpaceId, type SpaceTone, type VenueSpace, type VenueTable } from "@/mocks/service-day";
import { regenerateTableQr } from "@/features/table-qr/qr-config";
import { deleteSpace, moveSpace, saveSpace, validateSpaceName } from "./space-config";
import {
  applyTableDraft,
  getQuickToggle,
  getSessionStatuses,
  setTableEnabled,
  validateTableDraft,
  type SessionStatus,
  type TableDraft,
} from "./table-config";
import { moveTable, resizeTable, setTableShape, type TableShape } from "./table-layout";
import { deleteTable, getTableNumbersWithHistory, getTableRemoval } from "./table-removal";

/**
 * The venue configuration shared by `/tables`, `/tables/management` and `/tables/qr`: spaces
 * and tables as edited in this browser session, plus the service-day facts the rules need.
 */
export type VenueState = {
  spaces: readonly VenueSpace[];
  tables: readonly VenueTable[];
  /** Live session status by table number; tables created in the session have none (free). */
  sessions: Readonly<Record<number, SessionStatus>>;
  /** Numbers of the tables that ever had a session: they can be disabled, never deleted. */
  history: readonly number[];
};

/** Who issues a credential and the token it carries (generated unique by the screen). */
export type CredentialInput = { token: string; today: string; staffName: string };

export type VenueAction =
  | { type: "save-space"; editingId: SpaceId | null; name: string; icon?: SpaceIcon; tone?: SpaceTone }
  | { type: "move-space"; id: SpaceId; direction: -1 | 1 }
  | { type: "delete-space"; id: SpaceId }
  | { type: "save-table"; editingId: string | null; draft: TableDraft; shape?: TableShape; credential: CredentialInput }
  | { type: "set-table-enabled"; id: string; enabled: boolean }
  | { type: "delete-table"; id: string }
  | { type: "move-table"; id: string; x: number; y: number }
  | { type: "resize-table"; id: string; x: number; y: number; width: number; height: number }
  | { type: "set-table-shape"; id: string; shape: TableShape }
  | ({ type: "regenerate-qr"; id: string } & CredentialInput);

export function createVenueState(day: ServiceDay = SERVICE_DAY): VenueState {
  return {
    spaces: day.spaces,
    tables: day.tables,
    sessions: getSessionStatuses(day),
    history: getTableNumbersWithHistory(day),
  };
}

export const sessionOf = (state: VenueState, table: VenueTable): SessionStatus => state.sessions[table.number] ?? "available";

const withTables = (state: VenueState, tables: readonly VenueTable[]) => (tables === state.tables ? state : { ...state, tables });

const toContext = ({ token, today, staffName }: CredentialInput) => ({ today, staffName, createToken: () => token });

/**
 * Pure venue reducer. Every action re-checks its rule, so an invalid one (duplicate name,
 * overlapping drop, deleting a table with history…) returns the same state.
 */
export function venueReducer(state: VenueState, action: VenueAction): VenueState {
  switch (action.type) {
    case "save-space": {
      if (validateSpaceName(action.name, state.spaces, action.editingId)) return state;
      const existing = action.editingId ? state.spaces.find((space) => space.id === action.editingId) : undefined;
      const style =
        action.icon || action.tone
          ? { icon: action.icon ?? existing?.icon ?? "map-pin", tone: action.tone ?? existing?.tone ?? "neutral" }
          : undefined;
      return { ...state, spaces: saveSpace(state.spaces, action.editingId, action.name, style).spaces };
    }
    case "move-space": {
      const spaces = moveSpace(state.spaces, action.id, action.direction);
      return spaces === state.spaces ? state : { ...state, spaces };
    }
    case "delete-space": {
      const spaces = deleteSpace(state.spaces, state.tables, action.id);
      return spaces === state.spaces ? state : { ...state, spaces };
    }
    case "save-table": {
      const errors = validateTableDraft(action.draft, state.tables, action.editingId, state.spaces);
      if (Object.keys(errors).length > 0) return state;
      const saved = applyTableDraft(state.tables, action.editingId, action.draft, toContext(action.credential));
      const tables = action.shape ? setTableShape(saved.tables, saved.id, action.shape) : saved.tables;
      return withTables(state, tables);
    }
    case "set-table-enabled": {
      const table = state.tables.find((candidate) => candidate.id === action.id);
      if (!table || table.enabled === action.enabled) return state;
      if (!getQuickToggle(table, sessionOf(state, table)).allowed) return state;
      return withTables(state, setTableEnabled(state.tables, table.id, action.enabled));
    }
    case "delete-table": {
      const table = state.tables.find((candidate) => candidate.id === action.id);
      if (!table) return state;
      const removal = getTableRemoval(table, { hadSession: state.history.includes(table.number), session: sessionOf(state, table) });
      return removal.kind === "delete" ? withTables(state, deleteTable(state.tables, table.id)) : state;
    }
    case "move-table":
      return withTables(state, moveTable(state.tables, action.id, { x: action.x, y: action.y }).tables);
    case "resize-table": {
      const { id, x, y, width, height } = action;
      return withTables(state, resizeTable(state.tables, id, { x, y, width, height }).tables);
    }
    case "set-table-shape":
      return withTables(state, setTableShape(state.tables, action.id, action.shape));
    case "regenerate-qr":
      if (!state.tables.some((table) => table.id === action.id)) return state;
      return withTables(state, regenerateTableQr(state.tables, action.id, toContext(action)));
  }
}
