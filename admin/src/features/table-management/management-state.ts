import type { SpaceIcon, SpaceId, SpaceTone, VenueTable } from "@/mocks/service-day";
import { getChairs, type Chair } from "@/features/tables/floor-plan";
import {
  DEFAULT_SPACE_STYLE,
  createSpaceId,
  getSpaceCards,
  getSpaceName,
  getSpaceRemoval,
  validateSpaceName,
  type SpaceCard,
} from "@/features/venue/space-config";
import {
  createEmptyTableDraft,
  formatCapacity,
  getTableChanges,
  nextTableId,
  toTableDraft,
  validateTableDraft,
  type TableDraft,
  type TableDraftErrors,
} from "@/features/venue/table-config";
import { resolveMove, type TableShape } from "@/features/venue/table-layout";
import { getTableRemoval, type TableRemoval } from "@/features/venue/table-removal";
import { sessionOf, venueReducer, type CredentialInput, type VenueAction, type VenueState } from "@/features/venue/venue-state";

export type TableForm = { id: string | null; draft: TableDraft; shape: TableShape; submitted: boolean };
export type SpaceForm = { id: SpaceId | null; name: string; icon: SpaceIcon; tone: SpaceTone; submitted: boolean };

/** Right panel: the selected (or new) table, otherwise the active (or new) space. */
export type Panel = { kind: "table"; form: TableForm } | { kind: "space"; form: SpaceForm };

export type Notice = { tone: "info" | "error"; text: string };

export type ManagementState = {
  /** Space whose plan is open. */
  spaceId: SpaceId;
  panel: Panel;
  /** Delete confirmation for the panel's table or space. */
  confirm: { kind: "table" | "space"; id: string } | null;
  /** Last outcome, shown over the plan and announced. */
  notice: Notice | null;
};

export type ManagementAction =
  | { type: "select-space"; id: SpaceId }
  | { type: "select-table"; id: string }
  | { type: "new-table" }
  | { type: "set-table-field"; field: "label" | "capacity" | "description" | "spaceId"; value: string }
  | { type: "set-table-field"; field: "enabled"; value: boolean }
  | { type: "set-table-shape"; shape: TableShape }
  | { type: "save-table"; credential: CredentialInput }
  | { type: "new-space" }
  | { type: "set-space-field"; field: "name"; value: string }
  | { type: "set-space-field"; field: "icon"; value: SpaceIcon }
  | { type: "set-space-field"; field: "tone"; value: SpaceTone }
  | { type: "save-space" }
  | { type: "move-space"; id: SpaceId; direction: -1 | 1 }
  | { type: "cancel" }
  | { type: "request-delete" }
  | { type: "confirm-delete" }
  | { type: "cancel-delete" }
  | { type: "move-table"; id: string; x: number; y: number }
  | { type: "dismiss-notice" };

const spaceForm = (venue: VenueState, id: SpaceId): SpaceForm => {
  const space = venue.spaces.find((candidate) => candidate.id === id);
  return {
    id: space?.id ?? null,
    name: space?.name ?? "",
    icon: space?.icon ?? DEFAULT_SPACE_STYLE.icon,
    tone: space?.tone ?? DEFAULT_SPACE_STYLE.tone,
    submitted: false,
  };
};

const spacePanel = (venue: VenueState, id: SpaceId): Panel => ({ kind: "space", form: spaceForm(venue, id) });

const tablePanel = (table: VenueTable): Panel => ({
  kind: "table",
  form: { id: table.id, draft: toTableDraft(table), shape: table.layout.shape, submitted: false },
});

export function createManagementState(venue: VenueState): ManagementState {
  const spaceId = venue.spaces[0]?.id ?? "";
  return { spaceId, panel: spacePanel(venue, spaceId), confirm: null, notice: null };
}

const findTable = (venue: VenueState, id: string | null) => (id ? venue.tables.find((table) => table.id === id) : undefined);

function removalOf(venue: VenueState, table: VenueTable): TableRemoval {
  return getTableRemoval(table, { hadSession: venue.history.includes(table.number), session: sessionOf(venue, table) });
}

export type ManagementResult = { ui: ManagementState; venue?: VenueAction };

const info = (text: string): Notice => ({ tone: "info", text });
const error = (text: string): Notice => ({ tone: "error", text });

function saveTable(ui: ManagementState, form: TableForm, venue: VenueState, credential: CredentialInput): ManagementResult {
  const errors = validateTableDraft(form.draft, venue.tables, form.id, venue.spaces);
  if (Object.keys(errors).length > 0) {
    return { ui: { ...ui, panel: { kind: "table", form: { ...form, submitted: true } }, notice: error("Revisá los datos marcados.") } };
  }
  const saved = findTable(venue, form.id) ?? null;
  if (saved && getTableChanges(saved, form.draft).length === 0 && saved.layout.shape === form.shape) {
    return { ui: { ...ui, notice: info(`Sin cambios en ${saved.label}.`) } };
  }
  const action: VenueAction = { type: "save-table", editingId: form.id, draft: form.draft, shape: form.shape, credential };
  const next = venueReducer(venue, action);
  const table = findTable(next, form.id ?? nextTableId(venue.tables))!;
  return {
    venue: action,
    ui: {
      ...ui,
      spaceId: table.spaceId,
      panel: tablePanel(table),
      notice: info(`${table.label} ${saved ? "guardada" : "creada"}.`),
    },
  };
}

function saveSpaceForm(ui: ManagementState, form: SpaceForm, venue: VenueState): ManagementResult {
  if (validateSpaceName(form.name, venue.spaces, form.id)) {
    return { ui: { ...ui, panel: { kind: "space", form: { ...form, submitted: true } }, notice: error("Revisá el nombre del espacio.") } };
  }
  const action: VenueAction = { type: "save-space", editingId: form.id, name: form.name, icon: form.icon, tone: form.tone };
  const id = form.id ?? createSpaceId(form.name.trim(), venue.spaces);
  const next = venueReducer(venue, action);
  return {
    venue: action,
    ui: {
      ...ui,
      spaceId: id,
      panel: spacePanel(next, id),
      notice: info(`Espacio ${form.name.trim()} ${form.id ? "guardado" : "creado"}.`),
    },
  };
}

function confirmDelete(ui: ManagementState, venue: VenueState): ManagementResult {
  const { confirm } = ui;
  if (!confirm) return { ui };
  const closed = { ...ui, confirm: null };
  if (confirm.kind === "space") {
    if (!getSpaceRemoval(venue.spaces, venue.tables, confirm.id).allowed) return { ui: closed };
    const action: VenueAction = { type: "delete-space", id: confirm.id };
    const next = venueReducer(venue, action);
    const spaceId = next.spaces[0]?.id ?? "";
    const name = getSpaceName(venue.spaces, confirm.id);
    return { venue: action, ui: { ...closed, spaceId, panel: spacePanel(next, spaceId), notice: info(`Espacio ${name} eliminado.`) } };
  }
  const table = findTable(venue, confirm.id);
  if (!table) return { ui: closed };
  const removal = removalOf(venue, table);
  if (removal.kind === "delete") {
    return {
      venue: { type: "delete-table", id: table.id },
      ui: { ...closed, panel: spacePanel(venue, ui.spaceId), notice: info(`${table.label} eliminada.`) },
    };
  }
  if (removal.kind === "disable") {
    const action: VenueAction = { type: "set-table-enabled", id: table.id, enabled: false };
    const updated = findTable(venueReducer(venue, action), table.id)!;
    return { venue: action, ui: { ...closed, panel: tablePanel(updated), notice: info(`${table.label} deshabilitada.`) } };
  }
  return { ui: closed };
}

/**
 * Pure UI reducer of the management screen. It never mutates the venue: when an action changes
 * the configuration it also returns the `VenueAction` the screen sends to the shared store.
 */
export function reduceManagement(ui: ManagementState, action: ManagementAction, venue: VenueState): ManagementResult {
  const { panel } = ui;
  switch (action.type) {
    case "select-space":
      if (!venue.spaces.some((space) => space.id === action.id)) return { ui };
      return { ui: { ...ui, spaceId: action.id, panel: spacePanel(venue, action.id), confirm: null } };
    case "select-table": {
      const table = findTable(venue, action.id);
      if (!table) return { ui };
      return { ui: { ...ui, spaceId: table.spaceId, panel: tablePanel(table), confirm: null } };
    }
    case "new-table": {
      const draft = { ...createEmptyTableDraft(venue.tables, venue.spaces), spaceId: ui.spaceId };
      return { ui: { ...ui, panel: { kind: "table", form: { id: null, draft, shape: "rect", submitted: false } }, notice: null } };
    }
    case "set-table-field":
      if (panel.kind !== "table") return { ui };
      return {
        ui: { ...ui, panel: { kind: "table", form: { ...panel.form, draft: { ...panel.form.draft, [action.field]: action.value } } } },
      };
    case "set-table-shape":
      if (panel.kind !== "table") return { ui };
      return { ui: { ...ui, panel: { kind: "table", form: { ...panel.form, shape: action.shape } } } };
    case "save-table":
      return panel.kind === "table" ? saveTable(ui, panel.form, venue, action.credential) : { ui };
    case "new-space":
      return { ui: { ...ui, panel: { kind: "space", form: { ...spaceForm(venue, ""), id: null } }, notice: null } };
    case "set-space-field":
      if (panel.kind !== "space") return { ui };
      return { ui: { ...ui, panel: { kind: "space", form: { ...panel.form, [action.field]: action.value } } } };
    case "save-space":
      return panel.kind === "space" ? saveSpaceForm(ui, panel.form, venue) : { ui };
    case "move-space":
      return { venue: { type: "move-space", id: action.id, direction: action.direction }, ui };
    case "cancel":
      return { ui: { ...ui, panel: spacePanel(venue, ui.spaceId) } };
    case "request-delete": {
      const id = panel.form.id;
      if (!id) return { ui };
      return { ui: { ...ui, confirm: { kind: panel.kind, id } } };
    }
    case "confirm-delete":
      return confirmDelete(ui, venue);
    case "cancel-delete":
      return { ui: { ...ui, confirm: null } };
    case "move-table": {
      const table = findTable(venue, action.id);
      if (!table) return { ui };
      const result = resolveMove(venue.tables, table.id, { x: action.x, y: action.y });
      if (!result.ok) {
        const reason = result.reason === "overlap" ? `se superpone con ${result.conflict.label}` : "no está disponible";
        return { ui: { ...ui, notice: error(`${table.label} no entra ahí: ${reason}.`) } };
      }
      return { venue: { type: "move-table", id: table.id, x: action.x, y: action.y }, ui: { ...ui, notice: info(`${table.label} movida.`) } };
    }
    case "dismiss-notice":
      return { ui: { ...ui, notice: null } };
  }
}

// Views

export type SpaceTab = { id: SpaceId; name: string; count: number };

/** Space tabs over the plan, counting every table (disabled ones too). */
export function getSpaceTabs(venue: VenueState): SpaceTab[] {
  return venue.spaces.map((space) => ({
    id: space.id,
    name: space.name,
    count: venue.tables.filter((table) => table.spaceId === space.id).length,
  }));
}

export type EditorTable = {
  id: string;
  label: string;
  capacityLabel: string;
  shape: TableShape;
  x: number;
  y: number;
  chairs: Chair[];
  enabled: boolean;
  selected: boolean;
};

export type PlanView = { spaceName: string; countLabel: string; tables: EditorTable[] };

export function getPlanView(ui: ManagementState, venue: VenueState): PlanView {
  const selectedId = ui.panel.kind === "table" ? ui.panel.form.id : null;
  const tables = venue.tables
    .filter((table) => table.spaceId === ui.spaceId)
    .sort((a, b) => a.number - b.number)
    .map((table) => ({
      id: table.id,
      label: table.label,
      capacityLabel: formatCapacity(table.capacity),
      shape: table.layout.shape,
      x: table.layout.x,
      y: table.layout.y,
      chairs: getChairs(table.capacity),
      enabled: table.enabled,
      selected: table.id === selectedId,
    }));
  return {
    spaceName: getSpaceName(venue.spaces, ui.spaceId),
    countLabel: `${tables.length} ${tables.length === 1 ? "mesa" : "mesas"}`,
    tables,
  };
}

export type TableFormView = {
  form: TableForm;
  title: string;
  /** "ID estable · tbl_07 · versión 18". */
  idLabel: string;
  /** The table has an open session (09B "Sesión activa"). */
  activeSession: boolean;
  /** Existing tables show "Eliminar mesa"; the dialog explains when only disabling is possible. */
  canRemove: boolean;
  errors: TableDraftErrors;
};

export function getTableFormView(ui: ManagementState, venue: VenueState): TableFormView | null {
  if (ui.panel.kind !== "table") return null;
  const { form } = ui.panel;
  const table = findTable(venue, form.id);
  const errors = form.submitted ? validateTableDraft(form.draft, venue.tables, form.id, venue.spaces) : {};
  if (!table) {
    return {
      form,
      title: "Nueva mesa",
      idLabel: `ID estable · ${nextTableId(venue.tables)} · se asigna al guardar`,
      activeSession: false,
      canRemove: false,
      errors,
    };
  }
  return {
    form,
    title: "Editar mesa",
    idLabel: `ID estable · ${table.id} · versión ${table.version}`,
    activeSession: sessionOf(venue, table) !== "available",
    canRemove: true,
    errors,
  };
}

export type SpaceFormView = { form: SpaceForm; title: string; id: SpaceId | null; name: string; error: string | null; cards: SpaceCard[] };

export function getSpaceFormView(ui: ManagementState, venue: VenueState): SpaceFormView | null {
  if (ui.panel.kind !== "space") return null;
  const { form } = ui.panel;
  return {
    form,
    title: form.id ? "Espacio" : "Nuevo espacio",
    id: form.id,
    name: form.name,
    error: form.submitted ? validateSpaceName(form.name, venue.spaces, form.id) : null,
    cards: getSpaceCards(venue.spaces, venue.tables),
  };
}

export type ConfirmView = {
  title: string;
  description: string;
  confirmLabel: string | null;
  cancelLabel: string;
  /** Deleting is destructive (danger); disabling can be undone (primary). */
  tone: "danger" | "primary";
};

/** Delete dialog copy (invented): delete, offer to disable, or only explain why not. */
export function getConfirmView(ui: ManagementState, venue: VenueState): ConfirmView | null {
  const { confirm } = ui;
  if (!confirm) return null;
  if (confirm.kind === "space") {
    const name = getSpaceName(venue.spaces, confirm.id);
    const removal = getSpaceRemoval(venue.spaces, venue.tables, confirm.id);
    if (!removal.allowed) {
      return { title: `${name} no se puede eliminar`, description: removal.reason, confirmLabel: null, cancelLabel: "Entendido", tone: "primary" };
    }
    return {
      title: `¿Eliminar el espacio ${name}?`,
      description: "El espacio no tiene mesas. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar espacio",
      cancelLabel: "Cancelar",
      tone: "danger",
    };
  }
  const table = findTable(venue, confirm.id);
  if (!table) return null;
  const removal = removalOf(venue, table);
  if (removal.kind === "delete") {
    return {
      title: `¿Eliminar ${table.label}?`,
      description: "Se eliminan la mesa y su código QR. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar mesa",
      cancelLabel: "Cancelar",
      tone: "danger",
    };
  }
  return {
    title: `${table.label} no se puede eliminar`,
    description: removal.reason,
    confirmLabel: removal.kind === "disable" ? "Deshabilitar mesa" : null,
    cancelLabel: removal.kind === "disable" ? "Cancelar" : "Entendido",
    tone: "primary",
  };
}

/** `?space=<id>|new` then `?table=<id>|new`: what the screen opens first (links from 09). */
export function getDeepLinkActions({ table, space }: { table: string | null; space: string | null }): ManagementAction[] {
  const actions: ManagementAction[] = [];
  if (space === "new") actions.push({ type: "new-space" });
  else if (space) actions.push({ type: "select-space", id: space });
  if (table === "new") actions.push({ type: "new-table" });
  else if (table) actions.push({ type: "select-table", id: table });
  return actions;
}

/**
 * Initial UI after replaying `actions` (forced `?state=` variants and deep links). Only the UI
 * changes: an action that would edit the venue is skipped, so previews never touch the store.
 */
export function initManagementState(venue: VenueState, actions: readonly ManagementAction[]): ManagementState {
  return actions.reduce((ui, action) => {
    const result = reduceManagement(ui, action, venue);
    return result.venue ? ui : result.ui;
  }, createManagementState(venue));
}
