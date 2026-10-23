import clsx from "clsx";
import { ReceiptText, SearchX, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ManagedBillRequest } from "@/mocks/types";
import {
  formatRequestId,
  formatRequestTotal,
  formatTableLabel,
  getKitchenNote,
  getRowActions,
} from "./bill-requests-view";
import { PaymentPreference, StatusPill, WaitingIndicator } from "./BillRequestTags";

/** Column widths of the "Table Header" cells; the actions column takes the rest of the row. */
const COLUMNS = [
  { label: "Mesa", width: "w-[112px]" },
  { label: "Solicitud", width: "w-[130px]" },
  { label: "Tiempo de espera", width: "w-[140px]" },
  { label: "Preferencia de pago", width: "w-[180px]" },
  { label: "Total", width: "w-[120px]" },
  { label: "Estado", width: "w-[150px]" },
  { label: "Acciones", width: "" },
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
  onMarkAttending: (id: string) => void;
  onViewDetail: (id: string) => void;
};

const CELL = "px-3 align-middle";

/** "Solicitud · Mesa NN" row. */
function RequestRow({
  request,
  onMarkAttending,
  onViewDetail,
}: { request: ManagedBillRequest } & Pick<RequestsTableProps, "onMarkAttending" | "onViewDetail">) {
  const kitchenNote = getKitchenNote(request);
  const actions = getRowActions(request);
  const table = formatTableLabel(request);
  return (
    <tr className="h-[68px] border-b border-line bg-surface">
      <th scope="row" className={clsx(CELL, "text-left text-[12px] font-bold whitespace-nowrap text-ink")}>
        {table}
      </th>
      <td className={CELL}>
        {kitchenNote ? (
          <p className="text-[11px] font-semibold whitespace-nowrap text-warning">
            {formatRequestId(request)}
            <br />
            {kitchenNote}
          </p>
        ) : (
          <p className="text-[12px] font-semibold whitespace-nowrap text-muted">{formatRequestId(request)}</p>
        )}
      </td>
      <td className={CELL}>
        <WaitingIndicator request={request} />
      </td>
      <td className={CELL}>
        <PaymentPreference method={request.paymentPreference} />
      </td>
      <td className={clsx(CELL, "text-[13px] font-bold whitespace-nowrap text-ink")}>{formatRequestTotal(request)}</td>
      <td className={CELL}>
        <StatusPill status={request.status} />
      </td>
      <td className={CELL}>
        <div className="flex items-center gap-2">
          {actions.includes("mark-attending") && (
            <button
              type="button"
              onClick={() => onMarkAttending(request.id)}
              aria-label={`Marcar en atención ${table}`}
              className="flex h-[34px] items-center rounded-nav bg-brand px-3 text-[11px] font-bold whitespace-nowrap text-white hover:bg-brand/92"
            >
              Marcar en atención
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewDetail(request.id)}
            aria-label={`Ver detalle ${table}`}
            className="flex h-[34px] items-center rounded-nav px-3 text-[11px] font-bold whitespace-nowrap text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            Ver detalle
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
          className="mt-1 flex h-[34px] items-center rounded-nav px-3 text-[11px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
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
export function RequestsTable({ requests, emptyState, footerCount, onMarkAttending, onViewDetail }: RequestsTableProps) {
  return (
    <section
      aria-label="Solicitudes de cuenta"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-card bg-surface outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="min-h-0 shrink overflow-y-auto">
        <table className="w-full table-fixed border-collapse">
          <thead className="sticky top-0 z-[1] bg-sand">
            <tr className="h-[42px]">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={clsx("px-3 text-left text-[11px] font-bold whitespace-nowrap text-muted", column.width)}
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
                  onMarkAttending={onMarkAttending}
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
          "flex min-h-11 w-full items-center justify-between px-3.5",
          emptyState ? "shrink-0" : "flex-1",
        )}
      >
        <p className="text-[11px] font-semibold whitespace-nowrap text-muted">{footerCount}</p>
        <p className="flex items-center gap-[7px]">
          <ShieldCheck size={13} aria-hidden="true" className="shrink-0 text-muted" />
          <span className="text-[11px] font-semibold whitespace-nowrap text-muted">
            El cierre de mesa requiere autorización
          </span>
        </p>
      </footer>
    </section>
  );
}
