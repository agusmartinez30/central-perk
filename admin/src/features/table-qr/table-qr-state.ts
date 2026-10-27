import { SERVICE_DAY, type VenueSpace, type VenueTable } from "@/mocks/service-day";
import { getSpaceCards, getSpaceName, type SpaceCard } from "@/features/venue/space-config";
import { formatCapacity, getQuickToggle, setTableEnabled, type QuickToggle, type SessionStatus } from "@/features/venue/table-config";
import { createVenueState, type VenueAction, type VenueState } from "@/features/venue/venue-state";
import {
  PRINT_SIZES,
  filterBySpace,
  getPrintableTables,
  getPrintSize,
  getSelectedTables,
  paginate,
  selectSpace,
  toggleAll,
  toggleSelection,
  type PrintSize,
  type PrintSizeId,
} from "./print-selection";
import { formatCardTitle } from "./print-card";
import { buildTableQrUrl, formatDisplayUrl } from "./qr-url";
import {
  filterTableRows,
  getCredentialHistory,
  getTableMetrics,
  getTableRows,
  type ConfigurationFilter,
  type CredentialHistoryRow,
  type SpaceFilter,
  type TableMetrics,
  type TableRow,
} from "./qr-config";

/** Views of the single `/tables/qr` route. Tables and spaces are configured in Gestión de mesas. */
export type TableQrView = "list" | "detail" | "material";

export type BulkPrintState = { space: SpaceFilter; size: PrintSizeId; selection: string[] };

export type TableQrState = {
  /** 09A "Espacios", from the shared venue store. */
  spaces: readonly VenueSpace[];
  /** Tables and credentials, from the shared venue store. */
  tables: readonly VenueTable[];
  sessions: Readonly<Record<number, SessionStatus>>;
  /** Local ISO date the credential dates are compared with ("Generado hoy"). */
  today: string;
  view: TableQrView;
  query: string;
  /** 09A "Espacio" filter. */
  space: SpaceFilter;
  configuration: ConfigurationFilter;
  /** Table of the 09C QR detail or the 09D printable material. */
  detailId: string | null;
  /** 09F "¿Regenerar código QR?" is open over 09C. */
  regenerating: boolean;
  /** 09E "Imprimir códigos QR" modal over the list. */
  bulk: BulkPrintState | null;
  /** Last action outcome, announced to screen readers. */
  notice: string | null;
};

export type TableQrAction =
  | { type: "set-query"; query: string }
  | { type: "set-space"; space: SpaceFilter }
  | { type: "set-configuration"; configuration: ConfigurationFilter }
  | { type: "toggle-enabled"; id: string }
  | { type: "open-detail"; id: string }
  | { type: "open-material"; id: string }
  | { type: "close-detail" }
  /** From the list menu (`id`) or the open 09C drawer. */
  | { type: "open-regenerate"; id?: string }
  | { type: "cancel-regenerate" }
  /** The API issues the new credential; the screen sends the rotation to the venue store. */
  | { type: "confirm-regenerate" }
  | { type: "open-bulk" }
  | { type: "close-bulk" }
  | { type: "bulk-set-space"; space: SpaceFilter }
  | { type: "bulk-set-size"; size: PrintSizeId }
  | { type: "bulk-toggle"; id: string }
  | { type: "bulk-toggle-all" };

/** The 09 view over a venue (the shared store, or the canonical seed); live session status comes from the service day. */
export function createTableQrState(venue: VenueState = createVenueState(), today: string = SERVICE_DAY.date): TableQrState {
  return {
    spaces: venue.spaces,
    tables: venue.tables,
    sessions: venue.sessions,
    today,
    view: "list",
    query: "",
    space: "all",
    configuration: "all",
    detailId: null,
    regenerating: false,
    bulk: null,
    notice: null,
  };
}

const sessionOf = (state: TableQrState, table: VenueTable): SessionStatus => state.sessions[table.number] ?? "available";

/**
 * Pure 09 reducer. Only "toggle-enabled" and "confirm-regenerate" change the configuration: the
 * screen sends them to the API through the shared venue store (`getVenueCommand`).
 */
export function tableQrReducer(state: TableQrState, action: TableQrAction): TableQrState {
  switch (action.type) {
    case "set-query":
      return { ...state, query: action.query };
    case "set-space":
      return { ...state, space: action.space };
    case "set-configuration":
      return { ...state, configuration: action.configuration };
    case "toggle-enabled": {
      const table = state.tables.find((candidate) => candidate.id === action.id);
      if (!table) return state;
      const toggle = getQuickToggle(table, sessionOf(state, table));
      if (!toggle.allowed) return { ...state, notice: toggle.reason ?? null };
      return {
        ...state,
        tables: setTableEnabled(state.tables, table.id, !table.enabled),
        notice: `${table.label} ${table.enabled ? "deshabilitada" : "habilitada"}.`,
      };
    }
    case "open-detail":
    case "open-material":
      if (!state.tables.some((table) => table.id === action.id)) return state;
      return {
        ...state,
        view: action.type === "open-detail" ? "detail" : "material",
        detailId: action.id,
        regenerating: false,
        notice: null,
      };
    case "close-detail":
      return { ...state, view: "list", detailId: null, regenerating: false };
    case "open-regenerate": {
      const id = action.id ?? state.detailId;
      if (!id || !state.tables.some((table) => table.id === id)) return state;
      return { ...state, view: "detail", detailId: id, regenerating: true, notice: null };
    }
    case "cancel-regenerate":
      return { ...state, regenerating: false };
    case "confirm-regenerate": {
      const table = state.tables.find((candidate) => candidate.id === state.detailId);
      if (!table) return state;
      return {
        ...state,
        regenerating: false,
        notice: table.qr
          ? `Código QR de ${table.label} regenerado. El código anterior dejó de funcionar.`
          : `Código QR de ${table.label} generado.`,
      };
    }
    case "open-bulk":
      return {
        ...state,
        view: "list",
        bulk: { space: "all", size: "a6", selection: selectSpace(getPrintableTables(state.tables), "all") },
        notice: null,
      };
    case "close-bulk":
      return { ...state, bulk: null };
    case "bulk-set-space":
      if (!state.bulk) return state;
      return {
        ...state,
        bulk: { ...state.bulk, space: action.space, selection: selectSpace(getPrintableTables(state.tables), action.space) },
      };
    case "bulk-set-size":
      return state.bulk ? { ...state, bulk: { ...state.bulk, size: action.size } } : state;
    case "bulk-toggle":
      return state.bulk ? { ...state, bulk: { ...state.bulk, selection: toggleSelection(state.bulk.selection, action.id) } } : state;
    case "bulk-toggle-all": {
      if (!state.bulk) return state;
      const visible = filterBySpace(getPrintableTables(state.tables), state.bulk.space);
      return { ...state, bulk: { ...state.bulk, selection: toggleAll(visible, state.bulk.selection) } };
    }
  }
}

/** The venue change an action asks the API for, once the local rules allow it; `null` otherwise. */
export function getVenueCommand(state: TableQrState, action: TableQrAction): VenueAction | null {
  if (action.type === "toggle-enabled") {
    const table = state.tables.find((candidate) => candidate.id === action.id);
    if (!table || !getQuickToggle(table, sessionOf(state, table)).allowed) return null;
    return { type: "set-table-enabled", id: table.id, enabled: !table.enabled };
  }
  if (action.type === "confirm-regenerate" && state.detailId && state.tables.some((table) => table.id === state.detailId)) {
    return { type: "regenerate-qr", id: state.detailId };
  }
  return null;
}

/** A row plus its "Más" quick enable/disable action. */
export type ListRow = TableRow & { toggle: QuickToggle };

export type ListView = { metrics: TableMetrics; spaces: SpaceCard[]; rows: ListRow[]; total: number };

export function getListView(state: TableQrState): ListView {
  const rows = getTableRows(state.tables, state.sessions, state.spaces);
  return {
    metrics: getTableMetrics(state.tables),
    spaces: getSpaceCards(state.spaces, state.tables),
    rows: filterTableRows(rows, { query: state.query, spaceId: state.space, configuration: state.configuration }).map(
      (row) => {
        const table = state.tables.find((candidate) => candidate.id === row.id)!;
        return { ...row, toggle: getQuickToggle(table, sessionOf(state, table)) };
      },
    ),
    total: rows.length,
  };
}

export type DetailView = {
  tableId: string;
  label: string;
  /** "Código QR · Mesa 07". */
  title: string;
  /** "Salón · 4 personas". */
  meta: string;
  /** "Mesa 07 · Salón". */
  identity: string;
  /** "ID interno estable · tbl_07". */
  stableId: string;
  /** QR target; null when the table has no credential. */
  url: string | null;
  displayUrl: string | null;
  /** Disabled tables keep their token, but the code does not admit new sessions. */
  enabled: boolean;
  history: CredentialHistoryRow[];
};

const findDetail = (state: TableQrState) => state.tables.find((table) => table.id === state.detailId);

export function getDetailView(state: TableQrState): DetailView | null {
  const table = findDetail(state);
  if (!table) return null;
  const spaceName = getSpaceName(state.spaces, table.spaceId);
  const url = table.qr ? buildTableQrUrl({ number: table.number, token: table.qr.token }) : null;
  return {
    tableId: table.id,
    label: table.label,
    title: `Código QR · ${table.label}`,
    meta: `${spaceName} · ${formatCapacity(table.capacity)}`,
    identity: `${table.label} · ${spaceName}`,
    stableId: `ID interno estable · ${table.id}`,
    url,
    displayUrl: url ? formatDisplayUrl(url) : null,
    enabled: table.enabled,
    history: getCredentialHistory(table, state.today),
  };
}

export type PrintCard = { tableId: string; label: string; title: string; url: string };

function toPrintCard(table: VenueTable): PrintCard {
  return {
    tableId: table.id,
    label: table.label,
    title: formatCardTitle(table.label),
    url: buildTableQrUrl({ number: table.number, token: table.qr?.token ?? "" }),
  };
}

export type MaterialView = {
  /** The table's card; null when it cannot be printed (disabled or without QR). */
  card: PrintCard | null;
  /** 09D "Hoja A4 · 6 tarjetas": the first compact sheet of the printable tables. */
  sheet: PrintCard[];
};

export function getMaterialView(state: TableQrState): MaterialView | null {
  const table = findDetail(state);
  if (!table) return null;
  const printable = getPrintableTables(state.tables);
  const [firstSheet = []] = paginate(printable, getPrintSize("compact").perSheet);
  return {
    card: printable.includes(table) ? toPrintCard(table) : null,
    sheet: firstSheet.map(toPrintCard),
  };
}

export type BulkRow = { id: string; label: string; selected: boolean };

export type BulkView = {
  /** "12 seleccionados". */
  countLabel: string;
  rows: BulkRow[];
  /** Every visible table is selected ("✓ Seleccionar todos" clears them). */
  allSelected: boolean;
  spaces: readonly VenueSpace[];
  space: SpaceFilter;
  size: PrintSizeId;
  sizes: readonly PrintSize[];
  perSheet: number;
  /** Selected cards split into A4 sheets. */
  sheets: PrintCard[][];
  /** "VISTA PREVIA · A4": the first sheet. */
  preview: PrintCard[];
  canExport: boolean;
};

export function getBulkView(state: TableQrState): BulkView | null {
  const { bulk } = state;
  if (!bulk) return null;
  const printable = getPrintableTables(state.tables);
  const visible = filterBySpace(printable, bulk.space);
  const selected = getSelectedTables(printable, bulk.selection);
  const { perSheet } = getPrintSize(bulk.size);
  const sheets = paginate(selected.map(toPrintCard), perSheet);
  return {
    countLabel: `${selected.length} ${selected.length === 1 ? "seleccionado" : "seleccionados"}`,
    rows: visible.map((table) => ({
      id: table.id,
      label: `${table.label} · ${getSpaceName(state.spaces, table.spaceId)}`,
      selected: bulk.selection.includes(table.id),
    })),
    allSelected: visible.length > 0 && visible.every((table) => bulk.selection.includes(table.id)),
    spaces: state.spaces,
    space: bulk.space,
    size: bulk.size,
    sizes: PRINT_SIZES,
    perSheet,
    sheets,
    preview: sheets[0] ?? [],
    canExport: selected.length > 0,
  };
}
