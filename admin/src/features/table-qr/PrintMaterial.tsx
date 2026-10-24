"use client";

import { ArrowLeft } from "lucide-react";
import { paginate } from "./print-selection";
import { DownloadButton, type DownloadFormat } from "./QrDetail";
import { PrintableCard, SheetCard } from "./PrintCards";
import type { MaterialView } from "./table-qr-state";
import { PageHeader } from "./TableQrParts";

type PrintMaterialProps = {
  view: MaterialView;
  onBack: () => void;
  onExport: (format: DownloadFormat) => void;
};

/**
 * 09D · Tarjeta QR imprimible ("Printable QR Main"): PNG / SVG / PDF exports of the table's
 * card, its preview, and the compact "Hoja A4 · 6 tarjetas" sheet. Cards keep the export's
 * print sizes.
 */
export function PrintMaterial({ view, onBack, onExport }: PrintMaterialProps) {
  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3.5 px-7 py-[18px]">
      <PageHeader
        title="Material QR imprimible"
        subtitle="Prepará piezas listas para mesa y exportación."
        actions={
          <>
            {/* Invented: the export does not show how to leave 09D. */}
            <button
              type="button"
              onClick={onBack}
              className="flex h-[38px] items-center gap-1.5 rounded-nav px-3 text-ink hover:bg-sand"
            >
              <ArrowLeft size={13} aria-hidden="true" />
              <span className="text-[11px] font-bold">Volver</span>
            </button>
            {view.card && (
              <>
                <DownloadButton format="png" onClick={() => onExport("png")} />
                <DownloadButton format="svg" onClick={() => onExport("svg")} />
                <DownloadButton format="pdf" primary onClick={() => onExport("pdf")} />
              </>
            )}
          </>
        }
      />
      <div className="flex min-h-0 w-full flex-1 gap-5">
        <div className="flex h-full w-[460px] shrink-0 items-center justify-center rounded-[14px] bg-sand">
          {view.card ? (
            <PrintableCard card={view.card} />
          ) : (
            <p className="max-w-[300px] text-center text-[12px] text-muted">
              Solo se imprimen mesas habilitadas con un código QR activo.
            </p>
          )}
        </div>
        <section aria-labelledby="sheet-heading" className="flex min-w-0 flex-1 flex-col gap-2.5">
          <h3 id="sheet-heading" className="text-[13px] font-bold text-ink">
            Hoja A4 · 6 tarjetas
          </h3>
          <div className="flex w-full flex-1 flex-col gap-2.5 rounded-nav bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line">
            {paginate(view.sheet, 3).map((row) => (
              <div key={row[0].tableId} className="flex w-full flex-1 gap-2.5">
                {row.map((card) => (
                  <SheetCard key={card.tableId} card={card} />
                ))}
                {Array.from({ length: 3 - row.length }, (_, index) => (
                  <div key={index} className="flex-1" />
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
