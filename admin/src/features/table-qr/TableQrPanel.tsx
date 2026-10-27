"use client";

import { useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { toLocalDate } from "@/features/venue/tables-mapper";
import { describeVenueError } from "@/features/venue/venue-errors";
import { commitVenue, useVenue } from "@/features/venue/venue-store";
import type { VenueState } from "@/features/venue/venue-state";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { BulkPrintModal } from "./BulkPrintModal";
import { buildCardSvgMarkup, getQrFileName } from "./print-card";
import { PrintableCard } from "./PrintCards";
import { PrintPortal, printDocument } from "./PrintPortal";
import { PrintSheets } from "./PrintSheets";
import { copyText, downloadPng, downloadSvg } from "./qr-download";
import { buildQrSvgMarkup } from "./qr-matrix";
import { buildTableQrUrl } from "./qr-url";
import { QrDetail, type DownloadFormat } from "./QrDetail";
import { PrintMaterial } from "./PrintMaterial";
import { RegenerateDialog } from "./RegenerateDialog";
import {
  TABLE_QR_FORCED_STATES,
  createTableQrState,
  getBulkView,
  getDetailView,
  getListView,
  getMaterialView,
  getVenueCommand,
  tableQrReducer,
  type TableQrAction,
  type TableQrForcedState,
  type TableQrState,
} from "./table-qr-state";
import { TableConfigurationList, TableToolbar } from "./TableList";
import { HeaderButton } from "./TableQrParts";

const FORCED_ACTIONS: Record<TableQrForcedState, TableQrAction[]> = {
  detail: [{ type: "open-detail", id: "tbl_07" }],
  regenerate: [{ type: "open-detail", id: "tbl_07" }, { type: "open-regenerate" }],
  material: [{ type: "open-material", id: "tbl_07" }],
  "bulk-print": [{ type: "open-bulk" }],
};

/** The "Plano" tab of Gestión de mesas opened on a table, in its edit modal. */
const tableEditHref = (id: string) => `/tables/management?table=${encodeURIComponent(id)}`;

function initState(venue: VenueState, forcedState: TableQrForcedState | null): TableQrState {
  // Credentials carry the date the API issued them; "hoy" is the browser's local date.
  const state = createTableQrState(venue, toLocalDate(new Date().toISOString()) ?? undefined);
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(tableQrReducer, state), notice: null };
}

/** PNG exports are rasterized at 1024px (QR) and 960px (card, three times the 320px preview). */
const QR_PNG_WIDTH = 1024;
const CARD_PNG_WIDTH = 960;

type TableQrPanelProps = {
  /**
   * Lays out the 09A list inside the host screen (its header and tabs): `actions` go in the
   * header, `body` below the tabs. The 09C detail and 09D material take the whole page instead,
   * and their back actions return to the list.
   */
  frame: (parts: { actions: ReactNode; body: ReactNode }) => ReactNode;
};

/**
 * 09 · Códigos QR, the "Códigos QR" tab of Gestión de mesas (render it inside `VenueGate`).
 * Container: spaces and tables come from the shared venue store (loaded from the API, configured
 * in the "Plano" tab); this panel owns which view is open: the 09A list (with the 09E bulk print
 * modal), the 09C QR detail (with the 09F confirmation) or the 09D printable material.
 * Enabling/disabling and QR rotations go to the API, which issues the new token, its date and
 * issuer. `?state=` forces one of `TABLE_QR_FORCED_STATES`.
 */
export function TableQrPanel({ frame }: TableQrPanelProps) {
  const forcedState = useScreenState(TABLE_QR_FORCED_STATES);
  const venue = useVenue();
  const [ui, setUi] = useState(() => initState(venue, forcedState));
  const state: TableQrState = { ...ui, spaces: venue.spaces, tables: venue.tables, sessions: venue.sessions };

  /**
   * Runs the pure reducer over the store's tables. A configuration change goes to the API first:
   * the reducer's outcome (closing 09F, the notice) applies once the API answers.
   */
  const dispatch = (action: TableQrAction) => {
    const next = tableQrReducer(state, action);
    const command = getVenueCommand(state, action);
    if (!command) return setUi(next);
    void commitVenue(command).then((outcome) => {
      if (outcome.ok) setUi((current) => ({ ...current, regenerating: next.regenerating, notice: next.notice }));
      else if (outcome.error.kind !== "unauthorized") {
        setUi((current) => ({ ...current, regenerating: false, notice: describeVenueError(outcome.error, command, venue) }));
      }
    });
  };

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

  const bulkView = state.view === "list" ? getBulkView(state) : null;

  let content;
  const detailView = getDetailView(state);
  if (state.view === "detail" && detailView) {
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
    content = frame({
      actions: (
        <HeaderButton label="Imprimir códigos QR" icon={Printer} tone="neutral" onClick={() => dispatch({ type: "open-bulk" })} />
      ),
      body: (
        <>
          <TableToolbar
            query={state.query}
            spaces={state.spaces}
            space={state.space}
            configuration={state.configuration}
            onQueryChange={(query) => dispatch({ type: "set-query", query })}
            onSpaceChange={(space) => dispatch({ type: "set-space", space })}
            onConfigurationChange={(configuration) => dispatch({ type: "set-configuration", configuration })}
          />
          <TableConfigurationList
            rows={list.rows}
            filtered={list.rows.length < list.total}
            actions={{
              editHref: tableEditHref,
              onToggleEnabled: (id) => dispatch({ type: "toggle-enabled", id }),
              onViewQr: (id) => dispatch({ type: "open-detail", id }),
              onDownload: (id) => downloadQr(id, "png"),
              onOpenMaterial: (id) => dispatch({ type: "open-material", id }),
              onRegenerate: (id) => dispatch({ type: "open-regenerate", id }),
            }}
          />
        </>
      ),
    });
  }

  return (
    <>
      {content}
      {state.view === "detail" && state.regenerating && (
        <RegenerateDialog
          onCancel={() => dispatch({ type: "cancel-regenerate" })}
          onConfirm={() => dispatch({ type: "confirm-regenerate" })}
        />
      )}
      {bulkView && (
        <>
          <BulkPrintModal view={bulkView} onAction={dispatch} onExport={printDocument} />
          <PrintPortal>
            <PrintSheets sheets={bulkView.sheets} perSheet={bulkView.perSheet} />
          </PrintPortal>
        </>
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
