"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { Armchair, Check, Copy, Download, QrCode as QrCodeIcon, Users, X, type LucideIcon } from "lucide-react";
import { QrCode } from "./QrCode";
import type { DetailView } from "./table-qr-state";
import { PageHeader } from "./TableQrParts";

type ConceptProps = { icon: LucideIcon; title: string; description: string };

/** "Concept · Mesa física / Credencial QR / Sesión compartida": 100px cards, 11px → 13px titles. */
function Concept({ icon: Icon, title, description }: ConceptProps) {
  return (
    <div className="flex h-[100px] w-full shrink-0 items-center gap-3 rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line">
      <Icon size={22} aria-hidden="true" className="shrink-0 text-brand" />
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        <p className="text-[11px] text-muted">{description}</p>
      </div>
    </div>
  );
}

export type DownloadFormat = "png" | "svg" | "pdf";

/** "Download PNG / SVG / PDF": 38px buttons, 9px brand labels → 11px. */
export function DownloadButton({ format, onClick, primary = false }: { format: DownloadFormat; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={format === "pdf" ? "Imprimir o guardar como PDF" : `Descargar ${format.toUpperCase()}`}
      className={clsx(
        "flex h-[38px] items-center justify-center gap-1.5 rounded-nav px-3 outline-1 -outline-offset-[0.5px]",
        primary ? "bg-brand text-white outline-brand hover:bg-brand/92" : "bg-surface text-brand outline-line hover:bg-cream",
      )}
    >
      <Download size={13} aria-hidden="true" className="shrink-0" />
      <span className="text-[11px] font-bold">{format.toUpperCase()}</span>
    </button>
  );
}

type QrDetailProps = {
  view: DetailView;
  onClose: () => void;
  onCopy: () => Promise<boolean>;
  onDownload: (format: DownloadFormat) => void;
  onRegenerate: () => void;
  /** Only enabled tables with a QR print (the PDF is the browser's print dialog). */
  canPrint: boolean;
};

/**
 * 09C · Detalle del código QR ("QR Detail Main"): the table identity and the three concepts
 * (physical table, QR credential, shared session) next to the QR drawer with the real code,
 * its public URL (copy), PNG / SVG / PDF, "Regenerar código QR" and the credential history.
 */
export function QrDetail({ view, onClose, onCopy, onDownload, onRegenerate, canPrint }: QrDetailProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3.5 px-7 pt-[18px]">
      <PageHeader title="Código QR de mesa" subtitle="Revisá la credencial permanente y sus descargas." />
      <div className="flex min-h-0 w-full flex-1 items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <section className="flex w-full flex-col gap-2 rounded-[14px] bg-brand p-[22px] text-white">
            <p className="text-[11px] font-bold tracking-[0.7px] text-white/67">RECURSO FÍSICO PERMANENTE</p>
            <h3 className="text-[24px] font-bold">{view.identity}</h3>
            <p className="w-full text-[12px]/[17px]">
              La credencial QR resuelve esta mesa. La sesión compartida se crea o recupera al confirmar el primer pedido.
            </p>
          </section>
          <Concept icon={Armchair} title="Mesa física" description={view.stableId} />
          <Concept icon={QrCodeIcon} title="Credencial QR" description="Token público activo y rotatable" />
          <Concept icon={Users} title="Sesión compartida" description="Temporal · una no cerrada por mesa" />
        </div>

        <aside
          aria-labelledby="qr-drawer-title"
          className="flex h-full w-[564px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-line bg-surface p-[22px]"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-[3px]">
              <h3 id="qr-drawer-title" className="text-[19px] font-bold text-ink">
                {view.title}
              </h3>
              <p className="text-[12px] text-muted">{view.meta}</p>
            </div>
            <button
              type="button"
              aria-label="Cerrar detalle del código QR"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-nav text-ink hover:bg-cream"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="flex h-[340px] w-full shrink-0 flex-col items-center gap-3 rounded-[16px] bg-surface p-[22px] outline-1 -outline-offset-[0.5px] outline-line">
            <p className="text-[11px] font-bold tracking-[0.6px] whitespace-nowrap text-brand">PROTOTIPO QR · TOKEN PÚBLICO</p>
            <div className="flex size-[236px] shrink-0 items-center justify-center rounded-[4px] bg-surface outline-1 -outline-offset-[0.5px] outline-ink">
              {view.url ? (
                <QrCode value={view.url} size={196} label={`Código QR de ${view.label}`} className="text-ink" />
              ) : (
                <p className="px-6 text-center text-[12px] text-muted">Esta mesa todavía no tiene código QR.</p>
              )}
            </div>
            <p className="text-center text-[11px]/[14px] whitespace-nowrap text-muted">
              {view.enabled ? "Escaneable con la cámara del celular" : "Mesa deshabilitada · el código no abre sesiones"}
              <br />
              No contiene ID de sesión
            </p>
          </div>

          <div className="flex h-[52px] w-full shrink-0 items-center justify-between gap-3 rounded-[9px] bg-cream px-3">
            <p className="min-w-0 truncate text-[12px] font-semibold text-ink" title={view.url ?? undefined}>
              {view.displayUrl ?? "Sin enlace público"}
            </p>
            {view.url && (
              <button
                type="button"
                aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
                title={copied ? "Enlace copiado" : "Copiar enlace"}
                onClick={async () => setCopied(await onCopy())}
                className={clsx("flex size-8 shrink-0 items-center justify-center rounded-nav hover:bg-surface", copied ? "text-success" : "text-ink")}
              >
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              </button>
            )}
          </div>

          {view.url && (
            <div className={clsx("grid w-full shrink-0 gap-2", canPrint ? "grid-cols-3" : "grid-cols-2")}>
              <DownloadButton format="png" onClick={() => onDownload("png")} />
              <DownloadButton format="svg" onClick={() => onDownload("svg")} />
              {canPrint && <DownloadButton format="pdf" onClick={() => onDownload("pdf")} />}
            </div>
          )}

          <button
            type="button"
            onClick={onRegenerate}
            className="flex h-10 w-full shrink-0 items-center justify-center rounded-[9px] bg-danger-bg text-[12px] font-bold text-danger hover:bg-danger/15"
          >
            {view.url ? "Regenerar código QR" : "Generar código QR"}
          </button>

          <h4 className="text-[11px] font-bold tracking-[0.6px] text-muted">HISTORIAL DE CREDENCIALES</h4>
          <ul className="flex w-full flex-col gap-3">
            {view.history.map((row) => (
              <li key={row.key} className="flex h-[37.5px] shrink-0 items-center justify-between border-b border-line">
                <span className={clsx("text-[11px] font-bold", row.status === "active" ? "text-success" : "text-muted")}>
                  {row.label}
                </span>
                <span className="text-[11px] text-muted">{row.meta}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
