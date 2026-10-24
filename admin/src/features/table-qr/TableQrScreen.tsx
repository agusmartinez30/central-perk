"use client";

import { useReducer } from "react";
import { Plus, Printer } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { buildCardSvgMarkup, getQrFileName } from "./print-card";
import { PrintableCard } from "./PrintCards";
import { PrintPortal, printDocument } from "./PrintPortal";
import { copyText, downloadPng, downloadSvg } from "./qr-download";
import { buildQrSvgMarkup } from "./qr-matrix";
import { createUniqueQrToken } from "./qr-token";
import { buildTableQrUrl } from "./qr-url";
import { QrDetail, type DownloadFormat } from "./QrDetail";
import { PrintMaterial } from "./PrintMaterial";
import { RegenerateDialog } from "./RegenerateDialog";
import { getUsedTokens } from "./table-config";
import {
  createTableQrState,
  getDetailView,
  getEditorView,
  getListView,
  getMaterialView,
  tableQrReducer,
  type TableQrAction,
  type TableQrState,
} from "./table-qr-state";
import { TableEditor } from "./TableEditor";
import { TableConfigurationList, TableToolbar } from "./TableList";
import { HeaderButton, MetricCards, PageHeader } from "./TableQrParts";

/**
 * Forced variants: `edit` (09B: Mesa 07), `new` (empty "Nueva mesa" form), `errors` (Mesa 07
 * renamed "Mesa 05" with capacity 0 after a save attempt; not in the exports), `detail` (09C:
 * Mesa 07), `regenerate` (09F over 09C) and `material` (09D: Mesa 07).
 */
export const TABLE_QR_FORCED_STATES = ["edit", "new", "errors", "detail", "regenerate", "material"] as const;

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
  detail: [{ type: "open-detail", id: "tbl_07" }],
  regenerate: [{ type: "open-detail", id: "tbl_07" }, { type: "open-regenerate" }],
  material: [{ type: "open-material", id: "tbl_07" }],
};

function initState(forcedState: ForcedState | null): TableQrState {
  const state = createTableQrState();
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(tableQrReducer, state), notice: null };
}

/** PNG exports are rasterized at 1024px (QR) and 960px (card, three times the 320px preview). */
const QR_PNG_WIDTH = 1024;
const CARD_PNG_WIDTH = 960;

/**
 * 09 · Mesas y códigos QR. Container: owns the venue tables as edited in this session (pure
 * `tableQrReducer`, seeded from the canonical service day) and which view is open: the 09A
 * list, the 09B editor, the 09C QR detail (with the 09F confirmation) or the 09D printable
 * material. New and rotated credentials get a secure token no table has ever used.
 */
export function TableQrScreen() {
  const forcedState = useScreenState(TABLE_QR_FORCED_STATES);
  const [state, dispatch] = useReducer(tableQrReducer, forcedState, initState);
  const newToken = () => createUniqueQrToken(getUsedTokens(state.tables));

  const downloadQr = (id: string, format: "png" | "svg") => {
    const table = state.tables.find((candidate) => candidate.id === id);
    if (!table?.qr) return;
    const svg = buildQrSvgMarkup(buildTableQrUrl({ number: table.number, token: table.qr.token }));
    const fileName = getQrFileName(table.label, "qr", format);
    if (format === "svg") downloadSvg(svg, fileName);
    else void downloadPng(svg, fileName, QR_PNG_WIDTH);
  };

  const material = state.view === "detail" || state.view === "material" ? getMaterialView(state) : null;
  const printCard = () => {
    if (material?.card) printDocument();
  };
  const exportCard = (format: DownloadFormat) => {
    const card = material?.card;
    if (!card) return;
    if (format === "pdf") return printDocument();
    const svg = buildCardSvgMarkup({ label: card.label, url: card.url });
    const fileName = getQrFileName(card.label, "tarjeta", format);
    if (format === "svg") downloadSvg(svg, fileName);
    else void downloadPng(svg, fileName, CARD_PNG_WIDTH);
  };

  let content;
  const editorView = getEditorView(state);
  const detailView = getDetailView(state);
  if (state.view === "editor" && state.editor && editorView) {
    content = (
      <TableEditor
        editor={state.editor}
        view={editorView}
        onAction={dispatch}
        onSave={() => dispatch({ type: "editor-save", token: newToken() })}
      />
    );
  } else if (state.view === "detail" && detailView) {
    content = (
      <QrDetail
        view={detailView}
        onClose={() => dispatch({ type: "close-detail" })}
        onCopy={() => (detailView.url ? copyText(detailView.url) : Promise.resolve(false))}
        onDownload={(format) => (format === "pdf" ? printCard() : downloadQr(detailView.tableId, format))}
        onRegenerate={() => dispatch({ type: "open-regenerate" })}
        canPrint={Boolean(material?.card)}
      />
    );
  } else if (state.view === "material" && material) {
    content = <PrintMaterial view={material} onBack={() => dispatch({ type: "close-detail" })} onExport={exportCard} />;
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
            onViewQr: (id) => dispatch({ type: "open-detail", id }),
            onDownload: (id) => downloadQr(id, "png"),
            onOpenMaterial: (id) => dispatch({ type: "open-material", id }),
            onRegenerate: (id) => dispatch({ type: "open-regenerate", id }),
          }}
        />
      </div>
    );
  }

  return (
    <>
      {content}
      {state.view === "detail" && state.regenerating && (
        <RegenerateDialog
          onCancel={() => dispatch({ type: "cancel-regenerate" })}
          onConfirm={() => dispatch({ type: "confirm-regenerate", token: newToken() })}
        />
      )}
      {material?.card && (
        <PrintPortal>
          <div className="flex justify-center pt-[10mm]">
            <PrintableCard card={material.card} />
          </div>
        </PrintPortal>
      )}
      <p role="status" className="sr-only">
        {state.notice}
      </p>
    </>
  );
}
