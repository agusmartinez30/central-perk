"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, ChefHat, ShieldCheck, X } from "lucide-react";
import type { ManagedBillRequest } from "@/mocks/types";
import {
  formatRequestId,
  formatTableLabel,
  getAssigneeLabel,
  getDetailInfo,
  getKitchenNote,
} from "./bill-requests-view";
import { StatusPill } from "./BillRequestTags";

type BillRequestDetailDrawerProps = {
  request: ManagedBillRequest;
  onClose: () => void;
};

/**
 * "Quick Detail · Mesa NN": 380px drawer over the right edge with the light "Drawer Backdrop"
 * over the rest of the main area. Escape or the backdrop closes it. "Ver detalle completo" has
 * no destination yet (the full request detail is not designed).
 */
export function BillRequestDetailDrawer({ request, onClose }: BillRequestDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const kitchenNote = getKitchenNote(request);
  const titleId = `bill-request-${request.id}`;

  useEffect(() => {
    closeRef.current?.focus();
  }, [request.id]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed top-[72px] right-[380px] bottom-0 left-[220px] z-20 bg-ink/7"
      />
      <aside
        role="dialog"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="fixed top-[72px] right-0 bottom-0 z-30 flex w-[380px] flex-col gap-3.5 overflow-y-auto bg-surface p-[22px] shadow-drawer"
      >
        <div className="flex w-full items-start justify-between">
          <div className="flex flex-col gap-[3px]">
            <h2 id={titleId} className="text-[22px] font-bold whitespace-nowrap text-ink">
              {formatTableLabel(request)}
            </h2>
            <p className="text-[11px] font-semibold whitespace-nowrap text-muted">
              Solicitud {formatRequestId(request)}
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
        <StatusPill status={request.status} />
        <dl className="flex w-full flex-col gap-2.5 rounded-[10px] bg-cream p-3.5">
          {getDetailInfo(request).map((row) => (
            <div key={row.label} className="flex w-full items-start justify-between text-[11px] whitespace-nowrap">
              <dt className="font-semibold text-muted">{row.label}</dt>
              <dd className="font-bold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex w-full items-center gap-2.5 rounded-[10px] bg-brand-wash p-3">
          <span aria-hidden="true" className="size-7 shrink-0 rounded-full bg-brand" />
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <p className="text-[11px] font-semibold text-muted">Responsable</p>
            <p className="text-[11px] font-bold text-brand">{getAssigneeLabel(request)}</p>
          </div>
        </div>
        {kitchenNote && (
          <p className="flex w-full items-center gap-2 rounded-nav bg-warning-bg px-2.5 py-2 text-warning">
            <ChefHat size={14} aria-hidden="true" className="shrink-0" />
            <span className="text-[11px] font-bold whitespace-nowrap">{kitchenNote}</span>
          </p>
        )}
        <p className="flex w-full items-start gap-2 rounded-field bg-sand p-[11px] text-muted">
          <ShieldCheck size={15} aria-hidden="true" className="shrink-0" />
          <span className="text-[11px] font-semibold">El pago y el cierre se verifican en el detalle completo.</span>
        </p>
        <div className="flex-1" />
        <button
          type="button"
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-field bg-brand text-[12px] font-bold whitespace-nowrap text-white hover:bg-brand/92"
        >
          Ver detalle completo
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </aside>
    </>
  );
}
