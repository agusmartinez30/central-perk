"use client";

import { useReducer } from "react";
import { Plus, Printer } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { createUniqueQrToken } from "./qr-token";
import { getUsedTokens } from "./table-config";
import {
  createTableQrState,
  getEditorView,
  getListView,
  tableQrReducer,
  type TableQrAction,
  type TableQrState,
} from "./table-qr-state";
import { TableEditor } from "./TableEditor";
import { TableConfigurationList, TableToolbar } from "./TableList";
import { HeaderButton, MetricCards, PageHeader } from "./TableQrParts";

/**
 * Forced variants: `edit` (09B: Mesa 07), `new` (empty "Nueva mesa" form) and `errors` (Mesa 07
 * renamed "Mesa 05" with capacity 0 after a save attempt; not in the exports).
 */
export const TABLE_QR_FORCED_STATES = ["edit", "new", "errors"] as const;

type ForcedState = (typeof TABLE_QR_FORCED_STATES)[number];

const FORCED_ACTIONS: Record<ForcedState, TableQrAction[]> = {
  edit: [{ type: "open-edit", id: "tbl_07" }],
  new: [{ type: "open-new" }],
  errors: [
    { type: "open-edit", id: "tbl_07" },
    { type: "editor-set-field", field: "label", value: "Mesa 05" },
    { type: "editor-set-field", field: "capacity", value: "0" },
    { type: "editor-save", token: "" },
  ],
};

function initState(forcedState: ForcedState | null): TableQrState {
  const state = createTableQrState();
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(tableQrReducer, state), notice: null };
}

/**
 * 09 · Mesas y códigos QR. Container: owns the venue tables as edited in this session (pure
 * `tableQrReducer`, seeded from the canonical service day) and which view is open: the 09A list
 * or the 09B editor. New credentials get a secure token no table has ever used.
 */
export function TableQrScreen() {
  const forcedState = useScreenState(TABLE_QR_FORCED_STATES);
  const [state, dispatch] = useReducer(tableQrReducer, forcedState, initState);
  const newToken = () => createUniqueQrToken(getUsedTokens(state.tables));

  let content;
  const editorView = getEditorView(state);
  if (state.view === "editor" && state.editor && editorView) {
    content = (
      <TableEditor
        editor={state.editor}
        view={editorView}
        onAction={dispatch}
        onSave={() => dispatch({ type: "editor-save", token: newToken() })}
      />
    );
  } else {
    const list = getListView(state);
    content = (
      // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
        <PageHeader
          title="Mesas y códigos QR"
          subtitle="Configurá tus mesas y los accesos a la carta digital."
          actions={
            <>
              <HeaderButton label="Imprimir códigos QR" icon={Printer} tone="neutral" onClick={() => {}} />
              <HeaderButton label="Nueva mesa" icon={Plus} tone="primary" onClick={() => dispatch({ type: "open-new" })} />
            </>
          }
        />
        <MetricCards
          items={[
            { label: "Mesas totales", value: list.metrics.total },
            { label: "Habilitadas", value: list.metrics.enabled },
            { label: "Sin QR", value: list.metrics.withoutQr },
            { label: "Deshabilitadas", value: list.metrics.disabled },
          ]}
        />
        <TableToolbar
          query={state.query}
          sector={state.sector}
          configuration={state.configuration}
          onQueryChange={(query) => dispatch({ type: "set-query", query })}
          onSectorChange={(sector) => dispatch({ type: "set-sector", sector })}
          onConfigurationChange={(configuration) => dispatch({ type: "set-configuration", configuration })}
        />
        <TableConfigurationList
          rows={list.rows}
          filtered={list.rows.length < list.total}
          actions={{
            onEdit: (id) => dispatch({ type: "open-edit", id }),
            onToggleEnabled: (id) => dispatch({ type: "toggle-enabled", id }),
          }}
        />
      </div>
    );
  }

  return (
    <>
      {content}
      <p role="status" className="sr-only">
        {state.notice}
      </p>
    </>
  );
}
