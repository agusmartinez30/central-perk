import clsx from "clsx";
import { BadgeCheck, Hand, PanelRightOpen, ReceiptText, TriangleAlert, WalletCards, X } from "lucide-react";
import type { BillRequestHistoryKind, ManagedBillRequest } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import {
  formatRequestId,
  formatRequestTotal,
  formatTableLabel,
  formatWait,
  getPaymentLabel,
  getPaymentVerificationLabel,
  getRowActions,
  type RowAction,
} from "./bill-requests-view";
import { PaymentVerificationPill, StatusPill } from "./BillRequestTags";

const PANEL =
  "flex h-full min-h-0 w-[362px] shrink-0 flex-col gap-3 overflow-y-auto rounded-card bg-surface p-[18px] shadow-[-4px_0_18px_#10101016] outline-1 -outline-offset-[0.5px] outline-line";

const HISTORY_LABELS: Record<BillRequestHistoryKind, string> = {
  requested: "Solicitud recibida",
  attending: "Atención iniciada",
  "receipt-reported": "Comprobante informado",
  "payment-verified": "Pago verificado",
  finalized: "Solicitud finalizada",
};

const ACTION_COPY: Record<Exclude<RowAction, "view-detail">, { label: string; icon: typeof Hand; className: string }> = {
  "mark-attending": { label: "Atender solicitud", icon: Hand, className: "bg-warning hover:bg-warning/90" },
  "verify-payment": { label: "Verificar pago", icon: BadgeCheck, className: "bg-danger hover:bg-danger/90" },
  finalize: { label: "Finalizar solicitud", icon: WalletCards, className: "bg-brand hover:bg-brand/92" },
};

type BillRequestDetailPanelProps = {
  request: ManagedBillRequest | null;
  onClose: () => void;
  onAction: (action: Exclude<RowAction, "view-detail">, id: string) => void;
};

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-[9px] font-extrabold tracking-[0.8px] text-muted">{children}</h3>;
}

/** Persistent, non-modal request detail with account lines, verification and workflow history. */
export function BillRequestDetailPanel({ request, onClose, onAction }: BillRequestDetailPanelProps) {
  if (!request) {
    return (
      <aside aria-label="Detalle de la solicitud" className={clsx(PANEL, "items-center justify-center text-center")}>
        <PanelRightOpen size={26} aria-hidden="true" className="text-muted" />
        <p className="text-[13px] font-bold text-ink">Ninguna solicitud seleccionada</p>
        <p className="max-w-[250px] text-[12px] text-muted">Elegí una solicitud de la tabla para revisar su detalle.</p>
      </aside>
    );
  }

  const titleId = `bill-request-detail-${request.id}`;
  const primary = getRowActions(request).find((action) => action !== "view-detail");
  const paymentPending = request.paymentVerification.status === "pending";

  return (
    <aside aria-labelledby={titleId} className={PANEL}>
      <div className="flex w-full shrink-0 items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-[19px] leading-tight font-extrabold text-ink">
            Solicitud {formatRequestId(request)}
          </h2>
          {paymentPending ? <PaymentVerificationPill verification={request.paymentVerification} /> : <StatusPill status={request.status} />}
        </div>
        <button
          type="button"
          aria-label="Cerrar detalle"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center rounded-nav bg-cream text-ink hover:bg-sand focus-visible:outline-2 focus-visible:outline-brand"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-1 rounded-nav bg-cream p-[11px]">
        <p className="text-[13px] font-extrabold text-ink">
          {formatTableLabel(request)} · {request.spaceName} · {request.customer}
        </p>
        <p className={clsx("text-[10px] font-bold", request.waitMinutes >= 20 ? "text-danger" : "text-muted")}>
          Solicitud recibida hace {formatWait(request.waitMinutes)}
        </p>
      </div>
      <SectionTitle>RESUMEN DE CONSUMOS</SectionTitle>
      <ul className="flex w-full shrink-0 flex-col gap-1.5">
        {request.consumptions.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 text-[11px] text-ink">
            <span className="font-semibold">{item.quantity}× {item.name}</span>
            <span className="shrink-0 font-bold">{formatPrice(item.total)}</span>
          </li>
        ))}
      </ul>
      <div className="flex w-full shrink-0 items-center justify-between rounded-nav bg-brand-wash p-[11px] text-brand">
        <span className="text-[10px] font-extrabold">TOTAL A COBRAR</span>
        <span className="text-[20px] font-extrabold">{formatRequestTotal(request)}</span>
      </div>
      <div className="flex w-full shrink-0 items-center justify-between rounded-nav bg-cream p-[11px]">
        <div>
          <p className="text-[9px] font-extrabold text-muted">PREFERENCIA DE PAGO</p>
          <p className="text-[13px] font-extrabold text-ink">{getPaymentLabel(request.paymentPreference)}</p>
        </div>
        <PaymentVerificationPill verification={request.paymentVerification} />
      </div>
      <SectionTitle>HISTORIAL</SectionTitle>
      <ol className="flex w-full shrink-0 flex-col gap-2">
        {request.history.map((event, index) => (
          <li key={`${event.kind}-${event.at}-${index}`} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-brand" />
            <time className="w-8 shrink-0 text-[9px] font-bold text-muted">{event.at}</time>
            <span className="text-[10px] font-semibold text-brand">
              {HISTORY_LABELS[event.kind]}{event.by ? ` por ${event.by}` : ""}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex-1" />
      {paymentPending && (
        <p className="flex w-full shrink-0 items-center gap-1.5 rounded-[7px] bg-danger-bg p-2 text-[9px] font-bold text-danger">
          <TriangleAlert size={14} aria-hidden="true" className="shrink-0" />
          No cerrar la mesa hasta verificar la acreditación.
        </p>
      )}
      <p className="sr-only" aria-live="polite">{getPaymentVerificationLabel(request.paymentVerification)}</p>
      <button
        type="button"
        className="flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[7px] bg-cream text-[10px] font-extrabold text-ink hover:bg-sand focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ReceiptText size={13} aria-hidden="true" />
        Ver detalle de consumos
      </button>
      {primary && (() => {
        const action = ACTION_COPY[primary];
        const Icon = action.icon;
        return (
          <button
            type="button"
            onClick={() => onAction(primary, request.id)}
            className={clsx(
              "flex h-[42px] w-full shrink-0 items-center justify-center gap-1.5 rounded-[7px] text-[10px] font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              action.className,
            )}
          >
            <Icon size={13} aria-hidden="true" />
            {action.label}
          </button>
        );
      })()}
    </aside>
  );
}
