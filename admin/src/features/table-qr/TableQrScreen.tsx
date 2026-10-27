"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Printer } from "lucide-react";
import { toLocalDate } from "@/features/venue/tables-mapper";
import { describeVenueError } from "@/features/venue/venue-errors";
import { VenueGate } from "@/features/venue/VenueGate";
import { commitVenue, useVenue } from "@/features/venue/venue-store";
import type { VenueState } from "@/features/venue/venue-state";
import { parseScreenState } from "@/shared/lib/screen-state";
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
  createTableQrState,
  getBulkView,
  getDetailView,
  getListView,
  getMaterialView,
  getVenueCommand,
  tableQrReducer,
  type TableQrAction,
  type TableQrState,
} from "./table-qr-state";
import { TableConfigurationList, TableToolbar } from "./TableList";
import { HeaderButton, HeaderLink, PageHeader } from "./TableQrParts";
import { SpacesManagement } from "./SpacesManagement";

/**
 * Forced variants: `detail` (09C: Mesa 07), `regenerate` (09F over 09C), `material` (09D:
 * Mesa 07) and `bulk-print` (09E over 09A with every printable table selected).
 */
export const TABLE_QR_FORCED_STATES = ["detail", "regenerate", "material", "bulk-print"] as const;

type ForcedState = (typeof TABLE_QR_FORCED_STATES)[number];

const FORCED_ACTIONS: Record<ForcedState, TableQrAction[]> = {
  detail: [{ type: "open-detail", id: "tbl_07" }],
  regenerate: [{ type: "open-detail", id: "tbl_07" }, { type: "open-regenerate" }],
  material: [{ type: "open-material", id: "tbl_07" }],
  "bulk-print": [{ type: "open-bulk" }],
};

/** Table and space editing moved to Gestión de mesas: its old `?state=` values redirect there. */
export const MOVED_STATES = {
  edit: "/tables/management?state=table-edit",
  new: "/tables/management?state=table-new",
  errors: "/tables/management?state=errors",
  "space-edit": "/tables/management?state=space-edit",
  "space-new": "/tables/management?state=space-new",
} as const;

const MOVED_STATE_IDS = Object.keys(MOVED_STATES) as (keyof typeof MOVED_STATES)[];

/** Gestión de mesas opened on a table (`new` for the creation form). */
const tableManagementHref = (id: string) => `/tables/management?table=${encodeURIComponent(id)}`;

function initState(venue: VenueState, forcedState: ForcedState | null): TableQrState {
  // Credentials carry the date the API issued them; "hoy" is the browser's local date.
  const state = createTableQrState(venue, toLocalDate(new Date().toISOString()) ?? undefined);
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(tableQrReducer, state), notice: null };
}

/** PNG exports are rasterized at 1024px (QR) and 960px (card, three times the 320px preview). */
const QR_PNG_WIDTH = 1024;
const CARD_PNG_WIDTH = 960;

/**
 * 09 · Mesas y códigos QR. Container: spaces and tables come from the shared venue store (loaded
 * from the API, configured in Gestión de mesas); this screen owns which view is open: the 09A
 * list (with the 09E bulk print modal), the 09C QR detail (with the 09F confirmation) or the 09D
 * printable material. Enabling/disabling and QR rotations go to the API, which issues the new
 * token, its date and issuer.
 */
export function TableQrScreen() {
  return (
    <VenueGate>
      <TableQr />
    </VenueGate>
  );
}

function TableQr() {
  const forcedState = useScreenState(TABLE_QR_FORCED_STATES);
  const movedState = parseScreenState(useSearchParams().get("state"), MOVED_STATE_IDS);
  const router = useRouter();
  const venue = useVenue();
  const [ui, setUi] = useState(() => initState(venue, forcedState));
  const state: TableQrState = { ...ui, spaces: venue.spaces, tables: venue.tables, sessions: venue.sessions };

  useEffect(() => {
    if (movedState) router.replace(MOVED_STATES[movedState]);
  }, [movedState, router]);

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
    content = (
      // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
        <PageHeader
          breadcrumb="Mesas / Espacios / Códigos QR"
          title="Mesas y códigos QR"
          subtitle="Administrá los accesos a la carta digital. Las mesas y los espacios se configuran en Gestión de mesas."
          actions={
            <>
              <HeaderButton
                label="Imprimir códigos QR"
                icon={Printer}
                tone="neutral"
                onClick={() => dispatch({ type: "open-bulk" })}
              />
              <HeaderLink href={tableManagementHref("new")} label="Nueva mesa" icon={Plus} tone="primary" />
            </>
          }
        />
        <SpacesManagement cards={list.spaces} />
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
            editHref: tableManagementHref,
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
