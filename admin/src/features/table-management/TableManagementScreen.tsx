"use client";

import clsx from "clsx";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Armchair, Plus, QrCode } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { ConfirmDialog, Modal } from "@/shared/ui";
import type { PlanTransform } from "@/features/tables/floor-plan";
import { HeaderButton, HeaderLink, PageHeader } from "@/features/table-qr/TableQrParts";
import { resolveMove, resolveResize } from "@/features/venue/table-layout";
import { VenueGate } from "@/features/venue/VenueGate";
import { commitVenue, useVenue } from "@/features/venue/venue-store";
import type { VenueState } from "@/features/venue/venue-state";
import {
  getConfirmView,
  getDeepLinkActions,
  getPlanView,
  getSpaceFormView,
  getSpaceList,
  getSpaceTabs,
  getTableFormView,
  failManagement,
  initManagementState,
  reduceManagement,
  settleManagement,
  type ManagementAction,
  type ManagementState,
  type SpaceTab,
} from "./management-state";
import { DEFAULT_EDITOR_TRANSFORM, PlanEditor } from "./PlanEditor";
import { SPACE_FORM_TITLE_ID, SpaceForm, SpaceList } from "./SpacePanel";
import { TABLE_FORM_TITLE_ID, TableForm } from "./TableForm";

/**
 * Forced variants, each with its modal open: `table-edit` (Mesa 07), `table-new` (empty "Nueva
 * mesa" in Salón), `space-edit` (Salón renamed "Salón principal", unsaved), `space-new` ("Barra"
 * typed), `delete-table` (Mesa 01, which has history: the dialog offers to disable it),
 * `delete-space` (Patio, which has tables: the dialog explains why not) and `errors` (Mesa 07
 * renamed "Mesa 05" with capacity 0 after saving). There is no export for this module.
 */
export const TABLE_MANAGEMENT_FORCED_STATES = [
  "table-edit",
  "table-new",
  "space-edit",
  "space-new",
  "delete-table",
  "delete-space",
  "errors",
] as const;

type ForcedState = (typeof TABLE_MANAGEMENT_FORCED_STATES)[number];

const FORCED_ACTIONS: Record<ForcedState, ManagementAction[]> = {
  "table-edit": [{ type: "select-table", id: "tbl_07" }],
  "table-new": [{ type: "new-table" }],
  "space-edit": [
    { type: "edit-space", id: "salon" },
    { type: "set-space-field", field: "name", value: "Salón principal" },
  ],
  "space-new": [{ type: "new-space" }, { type: "set-space-field", field: "name", value: "Barra" }],
  "delete-table": [{ type: "select-table", id: "tbl_01" }, { type: "request-delete" }],
  "delete-space": [{ type: "edit-space", id: "patio" }, { type: "request-delete" }],
  errors: [
    { type: "select-table", id: "tbl_07" },
    { type: "set-table-field", field: "label", value: "Mesa 05" },
    { type: "set-table-field", field: "capacity", value: "0" },
    { type: "save-table" },
  ],
};

type SpaceTabsProps = { tabs: readonly SpaceTab[]; activeId: string; onSelect: (id: string) => void; onNew: () => void };

/** The 02 "Floor Tabs" moved above the plan, with every table counted and "+ Nuevo espacio". */
function SpaceTabs({ tabs, activeId, onSelect, onNew }: SpaceTabsProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div role="tablist" aria-label="Espacios" className="flex min-w-0 gap-1 overflow-x-auto rounded-[9px] bg-surface p-1 outline-1 -outline-offset-[0.5px] outline-line">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-[6px] px-3 py-2 text-[12px] whitespace-nowrap",
                active ? "bg-ink font-bold text-white" : "font-semibold text-muted hover:bg-cream hover:text-ink",
              )}
            >
              {tab.name}
              <span className={clsx("text-[11px]", active ? "text-white/70" : "text-muted")}>{tab.count}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onNew}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-bold whitespace-nowrap text-brand hover:bg-brand-wash"
      >
        <Plus size={14} aria-hidden="true" />
        Nuevo espacio
      </button>
    </div>
  );
}

function initialState(venue: VenueState, forced: ForcedState | null, table: string | null, space: string | null): ManagementState {
  return initManagementState(venue, forced ? FORCED_ACTIONS[forced] : getDeepLinkActions({ table, space }));
}

/**
 * Gestión de mesas. Container: the venue configuration comes from the shared venue store, which
 * loads it from the API and sends every change there (so `/tables` and `/tables/qr` see it and
 * it survives a reload); this screen owns only the UI state (active space, create/edit modal,
 * delete dialog, notice and zoom). `?table=` and `?space=` open a table or space in the modal
 * directly (`new` for the creation forms).
 */
export function TableManagementScreen() {
  return (
    <VenueGate>
      <TableManagement />
    </VenueGate>
  );
}

function TableManagement() {
  const forcedState = useScreenState(TABLE_MANAGEMENT_FORCED_STATES);
  const searchParams = useSearchParams();
  const venue = useVenue();
  const [ui, setUi] = useState(() => initialState(venue, forcedState, searchParams.get("table"), searchParams.get("space")));
  const [transform, setTransform] = useState<PlanTransform>(DEFAULT_EDITOR_TRANSFORM);

  /**
   * Shows the UI the local rules predict right away; a configuration change then goes to the
   * API, whose answer settles the UI (ids it assigned) or restores the previous one with why.
   */
  const dispatch = (action: ManagementAction) => {
    const result = reduceManagement(ui, action, venue);
    if (result.ui.spaceId !== ui.spaceId) setTransform(DEFAULT_EDITOR_TRANSFORM);
    setUi(result.ui);
    const change = result.venue;
    if (!change) return;
    void commitVenue(change).then((outcome) => {
      if (outcome.ok) setUi((current) => settleManagement(current, outcome.before, outcome.venue));
      else if (outcome.error.kind !== "unauthorized") setUi(failManagement(ui, change, outcome.error, venue));
    });
  };

  const plan = getPlanView(ui, venue);
  const tableForm = getTableFormView(ui, venue);
  const spaceForm = getSpaceFormView(ui, venue);
  const confirm = getConfirmView(ui, venue);
  const close = () => dispatch({ type: "cancel" });

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3.5 px-6 pt-5 pb-4">
      <PageHeader
        breadcrumb="Mesas / Gestión de mesas"
        title="Gestión de mesas"
        subtitle="Configurá los espacios del local y ubicá cada mesa en su plano."
        actions={
          <>
            <HeaderLink href="/tables" label="Ver en vivo" icon={Armchair} />
            <HeaderLink href="/tables/qr" label="Códigos QR" icon={QrCode} />
          </>
        }
      />
      <div className="flex min-h-0 w-full flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex h-11 w-full shrink-0 items-center justify-between gap-3">
            <SpaceTabs
              tabs={getSpaceTabs(venue)}
              activeId={ui.spaceId}
              onSelect={(id) => dispatch({ type: "select-space", id })}
              onNew={() => dispatch({ type: "new-space" })}
            />
            <HeaderButton label="Nueva mesa" icon={Plus} tone="primary" onClick={() => dispatch({ type: "new-table" })} />
          </div>
          <PlanEditor
            view={plan}
            transform={transform}
            notice={ui.notice}
            onTransformChange={setTransform}
            onSelect={(id) => dispatch({ type: "select-table", id })}
            onMove={(id, point) => dispatch({ type: "move-table", id, ...point })}
            canDrop={(id, point) => resolveMove(venue.tables, id, point).ok}
            onResize={(id, rect) => dispatch({ type: "resize-table", id, ...rect })}
            canResize={(id, rect) => resolveResize(venue.tables, id, rect).ok}
            onDismissNotice={() => dispatch({ type: "dismiss-notice" })}
            onNewTable={() => dispatch({ type: "new-table" })}
          />
        </div>
        <aside aria-label="Lista de espacios" className="flex w-[320px] shrink-0 flex-col gap-3 overflow-y-auto pb-1">
          <SpaceList cards={getSpaceList(venue)} activeSpaceId={ui.spaceId} onAction={dispatch} />
        </aside>
      </div>
      {tableForm && (
        <Modal key={`table-${tableForm.form.id ?? "new"}`} labelledBy={TABLE_FORM_TITLE_ID} onClose={close}>
          <TableForm view={tableForm} spaces={venue.spaces} onAction={dispatch} onSave={() => dispatch({ type: "save-table" })} />
        </Modal>
      )}
      {spaceForm && (
        <Modal key={`space-${spaceForm.id ?? "new"}`} labelledBy={SPACE_FORM_TITLE_ID} onClose={close}>
          <SpaceForm view={spaceForm} onAction={dispatch} />
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          cancelLabel={confirm.cancelLabel}
          tone={confirm.tone}
          onCancel={() => dispatch({ type: "cancel-delete" })}
          onConfirm={() => dispatch({ type: "confirm-delete" })}
        />
      )}
      <p role="status" className="sr-only">
        {ui.notice?.text}
      </p>
    </div>
  );
}
