"use client";

import { useEffect, useRef } from "react";
import { LockKeyhole, X } from "lucide-react";
import type { ManagedCollection } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import {
  formatOrderProducts,
  formatOrderTitle,
  formatTableLabel,
  getAccountTotals,
  getAuditEvents,
  getCollectionFacts,
} from "./collections-view";
import { PaymentStatusPill } from "./CollectionTags";

type SelectedPaymentDetailProps = {
  collection: ManagedCollection;
  onClose: () => void;
};

/** "Payment Facts" / "Account Totals" row; the final total is bold and larger. */
function DetailRow({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex w-full items-start justify-between whitespace-nowrap">
      <dt className={emphasis ? "text-[11px] font-bold text-ink" : "text-[11px] font-semibold text-muted"}>{label}</dt>
      <dd className={emphasis ? "text-[13px] font-bold text-ink" : "text-[11px] font-bold text-ink"}>{value}</dd>
    </div>
  );
}

/**
 * "Selected Payment Detail": 400px read-only drawer over the right edge with the light
 * "History Drawer Backdrop" over the main area. Escape, the backdrop or the close button close it.
 * The 05 export has no actions besides closing ("Registro histórico de solo lectura").
 */
export function SelectedPaymentDetail({ collection, onClose }: SelectedPaymentDetailProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `collection-${collection.id}`;
  const totals = getAccountTotals(collection);

  useEffect(() => {
    closeRef.current?.focus();
  }, [collection.id]);

  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed top-[72px] right-0 bottom-0 left-[220px] z-20 bg-ink/7" />
      <aside
        role="dialog"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="fixed top-[72px] right-0 bottom-0 z-30 flex w-[400px] flex-col gap-3 overflow-y-auto bg-surface p-5 shadow-drawer"
      >
        <div className="flex w-full shrink-0 items-start justify-between">
          <div className="flex flex-col gap-[3px]">
            <h2 id={titleId} className="text-[20px] font-bold whitespace-nowrap text-ink">
              Cobro {collection.id}
            </h2>
            <p className="text-[11px] font-semibold whitespace-nowrap text-muted">
              Cuenta {collection.accountId} · {formatTableLabel(collection)}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar detalle"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream text-ink hover:bg-sand"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <PaymentStatusPill status={collection.status} />
        <dl className="flex w-full shrink-0 flex-col gap-2 rounded-[10px] bg-cream p-[13px]">
          {getCollectionFacts(collection).map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
        <h3 className="shrink-0 text-[13px] font-bold whitespace-nowrap text-ink">Historial completo de pedidos</h3>
        <ul className="flex w-full shrink-0 flex-col gap-3">
          {collection.orders.map((order) => (
            <li key={order.id} className="flex w-full flex-col gap-[9px] rounded-[10px] bg-cream p-[13px]">
              <div className="flex w-full items-start justify-between text-[12px] font-bold whitespace-nowrap text-ink">
                <span>{formatOrderTitle(order)}</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <p className="text-[11px] font-semibold text-muted">{formatOrderProducts(order)}</p>
            </li>
          ))}
        </ul>
        <dl className="flex w-full shrink-0 flex-col gap-[7px] py-1">
          {totals.map((row, index) => (
            <DetailRow key={row.label} label={row.label} value={row.value} emphasis={index === totals.length - 1} />
          ))}
        </dl>
        <h3 className="shrink-0 text-[13px] font-bold whitespace-nowrap text-ink">Auditoría</h3>
        <ol className="flex w-full shrink-0 flex-col gap-2.5">
          {getAuditEvents(collection).map((event) => (
            <li key={event.label} className="flex items-start gap-[9px]">
              <span aria-hidden="true" className="mt-1 size-[7px] shrink-0 rounded-full bg-brand" />
              <div className="flex flex-col gap-0.5 whitespace-nowrap">
                <p className="text-[11px] font-bold text-ink">{event.label}</p>
                <p className="text-[11px] text-muted">{event.at}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="flex w-full shrink-0 items-center gap-2 rounded-field bg-sand p-2.5 text-muted">
          <LockKeyhole size={14} aria-hidden="true" className="shrink-0" />
          <span className="text-[11px] font-bold">Registro histórico de solo lectura.</span>
        </p>
      </aside>
    </>
  );
}
