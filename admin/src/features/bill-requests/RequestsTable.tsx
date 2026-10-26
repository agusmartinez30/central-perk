import clsx from "clsx";
import { BadgeCheck, Hand, PanelRightOpen, ReceiptText, SearchX, WalletCards, type LucideIcon } from "lucide-react";
import type { ManagedBillRequest } from "@/mocks/types";
import {
  formatRequestId,
  formatRequestTotal,
  formatTableLabel,
  getRowActions,
} from "./bill-requests-view";
import { PaymentPreference, PaymentVerificationPill, StatusPill, WaitingIndicator } from "./BillRequestTags";

/** Column widths of the "Table Header" cells; the actions column takes the rest of the row. */
const COLUMNS = [
  { label: "Mesa / solicitud", width: "w-[178px]" },
  { label: "Espera", width: "w-[90px]" },
  { label: "Pago", width: "w-[130px]" },
  { label: "Total", width: "w-[92px]" },
  { label: "Estado", width: "w-[126px]" },
  { label: "Acción", width: "" },
] as const;

export type TableEmptyState = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

type RequestsTableProps = {
  requests: ManagedBillRequest[];
  emptyState: TableEmptyState | null;
  footerCount: string;
  selectedId: string | null;
  onMarkAttending: (id: string) => void;
  onVerifyPayment: (id: string) => void;
  onFinalize: (id: string) => void;
  onViewDetail: (id: string) => void;
};

const CELL = "px-3 align-middle";

/** "Solicitud · Mesa NN" row. */
function RequestRow({
  request,
  selected,
  onMarkAttending,
  onVerifyPayment,
  onFinalize,
  onViewDetail,
}: { request: ManagedBillRequest; selected: boolean } & Pick<
  RequestsTableProps,
  "onMarkAttending" | "onVerifyPayment" | "onFinalize" | "onViewDetail"
>) {
  const actions = getRowActions(request);
  const table = formatTableLabel(request);
  const primary = actions.find((action) => action !== "view-detail");
  const primaryControl = primary === "mark-attending"
    ? { label: "Atender", icon: Hand, onClick: onMarkAttending, className: "bg-warning" }
    : primary === "verify-payment"
      ? { label: "Verificar pago", icon: BadgeCheck, onClick: onVerifyPayment, className: "bg-danger" }
      : primary === "finalize"
        ? { label: "Finalizar", icon: WalletCards, onClick: onFinalize, className: "bg-brand" }
        : null;
  const PrimaryIcon = primaryControl?.icon;
  return (
    <tr
      aria-selected={selected}
      className={clsx(
        "h-[82px] border-b border-line",
        selected ? "bg-brand-wash shadow-[inset_3px_0_0_#2F45AD]" : "bg-surface",
      )}
    >
      <th scope="row" className={clsx(CELL, "text-left whitespace-nowrap")}>
        <span className="block text-[13px] font-extrabold text-ink">{table} · {request.spaceName}</span>
        <span className="block text-[10px] font-semibold text-muted">{formatRequestId(request)} · {request.customer}</span>
      </th>
      <td className={CELL}>
        <WaitingIndicator request={request} />
      </td>
      <td className={CELL}>
        <PaymentPreference method={request.paymentPreference} />
      </td>
      <td className={clsx(CELL, "text-[13px] font-bold whitespace-nowrap text-ink")}>{formatRequestTotal(request)}</td>
      <td className={CELL}>
        {request.paymentVerification.status === "pending" ? (
          <PaymentVerificationPill verification={request.paymentVerification} />
        ) : (
          <StatusPill status={request.status} />
        )}
      </td>
      <td className={CELL}>
        <div className="flex items-center gap-1.5">
          {primaryControl && PrimaryIcon && (
            <button
              type="button"
              onClick={() => primaryControl.onClick(request.id)}
              className={clsx(
                "flex h-[34px] w-[120px] items-center justify-center gap-1.5 rounded-[7px] px-2 text-[10px] font-extrabold whitespace-nowrap text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                primaryControl.className,
              )}
            >
              <PrimaryIcon size={13} aria-hidden="true" />
              {primaryControl.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetail(request.id)}
            aria-label={`Ver detalle ${table}`}
            aria-current={selected ? "true" : undefined}
            className="flex h-[34px] w-8 items-center justify-center rounded-[7px] text-muted outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream focus-visible:outline-2 focus-visible:outline-brand"
          >
            <PanelRightOpen size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ icon: Icon, title, description, action }: TableEmptyState) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <Icon size={28} aria-hidden="true" className="text-muted" />
      <p className="text-[14px] font-bold text-ink">{title}</p>
      <p className="max-w-[360px] text-[12px] text-muted">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 flex h-[34px] items-center rounded-nav px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream focus-visible:outline-2 focus-visible:outline-brand"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export const NO_REQUESTS_ICON = ReceiptText;
export const NO_RESULTS_ICON = SearchX;

/**
 * "Requests Table": sand "Table Header", one row per request (scrolling when they overflow)
 * and the "Table Footer" with the active count and the "Authority Note".
 */
export function RequestsTable({
  requests,
  emptyState,
  footerCount,
  selectedId,
  onMarkAttending,
  onVerifyPayment,
  onFinalize,
  onViewDetail,
}: RequestsTableProps) {
  return (
    <section
      aria-label="Solicitudes de cuenta"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="min-h-0 shrink overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-[1] bg-sand">
            <tr className="h-11">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={clsx("px-2.5 text-left text-[9px] font-extrabold whitespace-nowrap text-muted uppercase", column.width)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          {!emptyState && (
            <tbody>
              {requests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  selected={selectedId === request.id}
                  onMarkAttending={onMarkAttending}
                  onVerifyPayment={onVerifyPayment}
                  onFinalize={onFinalize}
                  onViewDetail={onViewDetail}
                />
              ))}
            </tbody>
          )}
        </table>
      </div>
      {emptyState && <EmptyState {...emptyState} />}
      <footer
        className={clsx(
          "flex min-h-11 w-full items-center justify-between bg-cream px-3.5",
          emptyState ? "shrink-0" : "flex-1",
        )}
      >
        <p aria-live="polite" className="text-[10px] font-bold whitespace-nowrap text-muted">{footerCount}</p>
        <p className="text-[9px] font-semibold whitespace-nowrap text-muted">Encabezado fijo · Desplazamiento vertical</p>
      </footer>
    </section>
  );
}
