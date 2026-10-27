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
import { resolveMove, resolveResize, type MoveResult, type TableShape } from "@/features/venue/table-layout";
import { getTableRemoval, type TableRemoval } from "@/features/venue/table-removal";
import type { TablesApiError } from "@/features/venue/tables-api";
import { describeVenueError, spaceIssueError, tableIssueErrors } from "@/features/venue/venue-errors";
import { sessionOf, venueReducer, type VenueAction, type VenueState } from "@/features/venue/venue-state";

export type TableForm = {
  id: string | null;
  draft: TableDraft;
  shape: TableShape;
  submitted: boolean;
  /** Field errors the API reported for the last save; cleared on the next edit. */
  serverErrors?: TableDraftErrors;
};
export type SpaceForm = {
  id: SpaceId | null;
  name: string;
  icon: SpaceIcon;
  tone: SpaceTone;
  submitted: boolean;
  /** Name error the API reported for the last save; cleared on the next edit. */
  serverError?: string | null;
};

/** Form shown in the centered modal: a table or a space being created or edited. */
export type Panel = { kind: "table"; form: TableForm } | { kind: "space"; form: SpaceForm };

export type Notice = { tone: "info" | "error"; text: string };

export type ManagementState = {
  /** Space whose plan is open. */
  spaceId: SpaceId;
  /** Open create/edit modal; null shows only the plan and the spaces list. */
  modal: Panel | null;
  /** The modal's save was sent to the API: it closes when the API accepts it. */
  saving: boolean;
  /** Delete confirmation for the modal's table or space. */
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
  | { type: "save-table" }
  | { type: "new-space" }
  | { type: "edit-space"; id: SpaceId }
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
  | { type: "resize-table"; id: string; x: number; y: number; width: number; height: number }
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
  return { spaceId: venue.spaces[0]?.id ?? "", modal: null, saving: false, confirm: null, notice: null };
}

const findTable = (venue: VenueState, id: string | null) => (id ? venue.tables.find((table) => table.id === id) : undefined);

function removalOf(venue: VenueState, table: VenueTable): TableRemoval {
  return getTableRemoval(table, { hadSession: venue.history.includes(table.number), session: sessionOf(venue, table) });
}

export type ManagementResult = { ui: ManagementState; venue?: VenueAction };

const info = (text: string): Notice => ({ tone: "info", text });
const error = (text: string): Notice => ({ tone: "error", text });

const refusal = (result: Exclude<MoveResult, { ok: true }>) =>
  result.reason === "overlap" ? `se superpone con ${result.conflict.label}` : "no está disponible";

/**
 * A valid save keeps the modal open, marked `saving`, with the predicted space and notice:
 * `settleManagement` closes it once the API accepts, `failManagement` restores it on a refusal.
 */
function saveTable(ui: ManagementState, form: TableForm, venue: VenueState): ManagementResult {
  const errors = validateTableDraft(form.draft, venue.tables, form.id, venue.spaces);
  if (Object.keys(errors).length > 0) {
    return { ui: { ...ui, modal: { kind: "table", form: { ...form, submitted: true } }, notice: error("Revisá los datos marcados.") } };
  }
  const saved = findTable(venue, form.id) ?? null;
  if (saved && getTableChanges(saved, form.draft).length === 0 && saved.layout.shape === form.shape) {
    return { ui: { ...ui, modal: null, notice: info(`Sin cambios en ${saved.label}.`) } };
  }
  const action: VenueAction = { type: "save-table", editingId: form.id, draft: form.draft, shape: form.shape };
  const next = venueReducer(venue, action);
  const table = findTable(next, form.id ?? nextTableId(venue.tables))!;
  return {
    venue: action,
    ui: { ...ui, spaceId: table.spaceId, saving: true, notice: info(`${table.label} ${saved ? "guardada" : "creada"}.`) },
  };
}

function saveSpaceForm(ui: ManagementState, form: SpaceForm, venue: VenueState): ManagementResult {
  if (validateSpaceName(form.name, venue.spaces, form.id)) {
    return { ui: { ...ui, modal: { kind: "space", form: { ...form, submitted: true } }, notice: error("Revisá el nombre del espacio.") } };
  }
  const action: VenueAction = { type: "save-space", editingId: form.id, name: form.name, icon: form.icon, tone: form.tone };
  return {
    venue: action,
    ui: {
      ...ui,
      spaceId: form.id ?? createSpaceId(form.name.trim(), venue.spaces),
      saving: true,
      notice: info(`Espacio ${form.name.trim()} ${form.id ? "guardado" : "creado"}.`),
    },
  };
}

/** A confirmed delete (or disable) closes the dialog and the modal; a refusal restores both. */
function confirmDelete(ui: ManagementState, venue: VenueState): ManagementResult {
  const { confirm } = ui;
  if (!confirm) return { ui };
  const closed = { ...ui, confirm: null };
  const done = { ...closed, modal: null };
  if (confirm.kind === "space") {
    if (!getSpaceRemoval(venue.spaces, venue.tables, confirm.id).allowed) return { ui: closed };
    const action: VenueAction = { type: "delete-space", id: confirm.id };
    const spaceId = venueReducer(venue, action).spaces[0]?.id ?? "";
    const name = getSpaceName(venue.spaces, confirm.id);
    return { venue: action, ui: { ...done, spaceId, notice: info(`Espacio ${name} eliminado.`) } };
  }
  const table = findTable(venue, confirm.id);
  if (!table) return { ui: closed };
  const removal = removalOf(venue, table);
  if (removal.kind === "delete") {
    return { venue: { type: "delete-table", id: table.id }, ui: { ...done, notice: info(`${table.label} eliminada.`) } };
  }
  if (removal.kind === "disable") {
    const action: VenueAction = { type: "set-table-enabled", id: table.id, enabled: false };
    return { venue: action, ui: { ...done, notice: info(`${table.label} deshabilitada.`) } };
  }
  return { ui: closed };
}

/**
 * Pure UI reducer of the management screen. It never mutates the venue: when an action changes
 * the configuration it also returns the `VenueAction` the screen sends to the API through the
 * shared store, and the UI predicted from the local rules. Once the API answers, the screen
 * reconciles with `settleManagement` (success) or `failManagement` (refusal).
 */
export function reduceManagement(ui: ManagementState, action: ManagementAction, venue: VenueState): ManagementResult {
  const { modal } = ui;
  const open = (next: Panel, spaceId = ui.spaceId): ManagementResult => ({
    ui: { ...ui, spaceId, modal: next, saving: false, confirm: null, notice: null },
  });
  switch (action.type) {
    case "select-space":
      if (!venue.spaces.some((space) => space.id === action.id)) return { ui };
      return { ui: { ...ui, spaceId: action.id } };
    case "edit-space":
      if (!venue.spaces.some((space) => space.id === action.id)) return { ui };
      return open(spacePanel(venue, action.id), action.id);
    case "select-table": {
      const table = findTable(venue, action.id);
      return table ? open(tablePanel(table), table.spaceId) : { ui };
    }
    case "new-table": {
      const draft = { ...createEmptyTableDraft(venue.tables, venue.spaces), spaceId: ui.spaceId };
      return open({ kind: "table", form: { id: null, draft, shape: "rect", submitted: false } });
    }
    case "set-table-field":
      if (modal?.kind !== "table") return { ui };
      return {
        ui: {
          ...ui,
          modal: { kind: "table", form: { ...modal.form, serverErrors: undefined, draft: { ...modal.form.draft, [action.field]: action.value } } },
        },
      };
    case "set-table-shape":
      if (modal?.kind !== "table") return { ui };
      return { ui: { ...ui, modal: { kind: "table", form: { ...modal.form, shape: action.shape } } } };
    case "save-table":
      return modal?.kind === "table" && !ui.saving ? saveTable(ui, modal.form, venue) : { ui };
    case "new-space":
      return open({ kind: "space", form: { ...spaceForm(venue, ""), id: null } });
    case "set-space-field":
      if (modal?.kind !== "space") return { ui };
      return { ui: { ...ui, modal: { kind: "space", form: { ...modal.form, serverError: undefined, [action.field]: action.value } } } };
    case "save-space":
      return modal?.kind === "space" && !ui.saving ? saveSpaceForm(ui, modal.form, venue) : { ui };
    case "move-space":
      return { venue: { type: "move-space", id: action.id, direction: action.direction }, ui };
    case "cancel":
      return { ui: { ...ui, modal: null, saving: false, confirm: null } };
    case "request-delete": {
      const id = modal?.form.id;
      if (!modal || !id) return { ui };
      return { ui: { ...ui, confirm: { kind: modal.kind, id } } };
    }
    case "confirm-delete":
      return confirmDelete(ui, venue);
    case "cancel-delete":
      return { ui: { ...ui, confirm: null } };
    case "move-table": {
      const table = findTable(venue, action.id);
      if (!table) return { ui };
      const result = resolveMove(venue.tables, table.id, { x: action.x, y: action.y });
      if (!result.ok) return { ui: { ...ui, notice: error(`${table.label} no entra ahí: ${refusal(result)}.`) } };
      return { venue: { type: "move-table", id: table.id, x: action.x, y: action.y }, ui: { ...ui, notice: info(`${table.label} movida.`) } };
    }
    case "resize-table": {
      const table = findTable(venue, action.id);
      if (!table) return { ui };
      const { x, y, width, height } = action;
      const result = resolveResize(venue.tables, table.id, { x, y, width, height });
      if (!result.ok) return { ui: { ...ui, notice: error(`${table.label} no entra con ese tamaño: ${refusal(result)}.`) } };
      return {
        venue: { type: "resize-table", id: table.id, x, y, width, height },
        ui: { ...ui, notice: info(`${table.label}: tamaño actualizado.`) },
      };
    }
    case "dismiss-notice":
      return { ui: { ...ui, notice: null } };
  }
}

/**
 * Reconciles the predicted UI with the configuration the API answered: a pending save closes
 * its modal, a space the API created opens with the id it assigned (it may differ from the
 * prediction), and a vanished space falls back to the first one.
 */
export function settleManagement(ui: ManagementState, before: VenueState, after: VenueState): ManagementState {
  const isNew = <T extends { id: string }>(list: readonly T[], id: string) => !list.some((item) => item.id === id);
  let next = ui;
  if (ui.saving) {
    const { modal } = ui;
    const created = modal?.kind === "space" && !modal.form.id ? after.spaces.find((space) => isNew(before.spaces, space.id)) : undefined;
    next = { ...ui, spaceId: created?.id ?? ui.spaceId, modal: null, saving: false };
  }
  if (isNew(after.spaces, next.spaceId)) next = { ...next, spaceId: after.spaces[0]?.id ?? "" };
  return next;
}

/**
 * The API refused `action`: back to the UI before it (the modal stays open with what was
 * typed) with the reason, the fields it rejected marked, and any delete dialog closed.
 */
export function failManagement(ui: ManagementState, action: VenueAction, apiError: TablesApiError, venue: VenueState): ManagementState {
  const failed: ManagementState = { ...ui, saving: false, confirm: null, notice: error(describeVenueError(apiError, action, venue)) };
  if (apiError.kind !== "invalid") return failed;
  const { modal } = ui;
  if (action.type === "save-table" && modal?.kind === "table") {
    return { ...failed, modal: { kind: "table", form: { ...modal.form, submitted: true, serverErrors: tableIssueErrors(apiError.issues) } } };
  }
  if (action.type === "save-space" && modal?.kind === "space") {
    return { ...failed, modal: { kind: "space", form: { ...modal.form, submitted: true, serverError: spaceIssueError(apiError.issues) } } };
  }
  return failed;
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
  /** Seats: the resize gesture keeps the box above the room its chairs need. */
  capacity: number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  chairs: Chair[];
  enabled: boolean;
  selected: boolean;
};

export type PlanView = { spaceName: string; countLabel: string; tables: EditorTable[] };

export function getPlanView(ui: ManagementState, venue: VenueState): PlanView {
  const selectedId = ui.modal?.kind === "table" ? ui.modal.form.id : null;
  const tables = venue.tables
    .filter((table) => table.spaceId === ui.spaceId)
    .sort((a, b) => a.number - b.number)
    .map((table) => ({
      id: table.id,
      label: table.label,
      capacityLabel: formatCapacity(table.capacity),
      capacity: table.capacity,
      shape: table.layout.shape,
      x: table.layout.x,
      y: table.layout.y,
      width: table.layout.width,
      height: table.layout.height,
      chairs: getChairs(table.capacity, table.layout),
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
  /** The save is waiting for the API. */
  saving: boolean;
  errors: TableDraftErrors;
};

export function getTableFormView(ui: ManagementState, venue: VenueState): TableFormView | null {
  if (ui.modal?.kind !== "table") return null;
  const { form } = ui.modal;
  const table = findTable(venue, form.id);
  const errors = form.submitted ? { ...form.serverErrors, ...validateTableDraft(form.draft, venue.tables, form.id, venue.spaces) } : {};
  if (!table) {
    return {
      form,
      title: "Nueva mesa",
      idLabel: `ID estable · ${nextTableId(venue.tables)} · se asigna al guardar`,
      activeSession: false,
      canRemove: false,
      saving: ui.saving,
      errors,
    };
  }
  return {
    form,
    title: "Editar mesa",
    idLabel: `ID estable · ${table.id} · versión ${table.version}`,
    activeSession: sessionOf(venue, table) !== "available",
    canRemove: true,
    saving: ui.saving,
    errors,
  };
}

export type SpaceFormView = { form: SpaceForm; title: string; id: SpaceId | null; name: string; error: string | null; saving: boolean };

export function getSpaceFormView(ui: ManagementState, venue: VenueState): SpaceFormView | null {
  if (ui.modal?.kind !== "space") return null;
  const { form } = ui.modal;
  return {
    form,
    title: form.id ? "Espacio" : "Nuevo espacio",
    id: form.id,
    name: form.name,
    error: form.submitted ? (validateSpaceName(form.name, venue.spaces, form.id) ?? form.serverError ?? null) : null,
    saving: ui.saving,
  };
}

/** "Espacios" list beside the plan: every space in order, with its table count. */
export function getSpaceList(venue: VenueState): SpaceCard[] {
  return getSpaceCards(venue.spaces, venue.tables);
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

/**
 * `?space=<id>|new` then `?table=<id>|new`: the modal the screen opens first (links from 09).
 * With both, the space only picks the plan behind the table modal.
 */
export function getDeepLinkActions({ table, space }: { table: string | null; space: string | null }): ManagementAction[] {
  const actions: ManagementAction[] = [];
  if (space === "new") actions.push({ type: "new-space" });
  else if (space) actions.push(table ? { type: "select-space", id: space } : { type: "edit-space", id: space });
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
