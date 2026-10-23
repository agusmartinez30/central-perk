import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { AttentionOrder, BillRequest } from "@/mocks/types";
import { Card } from "@/shared/ui";
import { PanelHeader } from "./PanelHeader";
import {
  formatBillMeta,
  formatBillWarning,
  formatOrderIdentity,
  formatOrderItems,
} from "./overview-view";

const ORDER_STATUS_LABELS: Record<AttentionOrder["status"], string> = {
  received: "RECIBIDO",
  preparing: "EN PREPARACIÓN",
  delivered: "ENTREGADO",
};

function ListPanel({
  title,
  linkLabel,
  href,
  children,
}: {
  title: string;
  linkLabel: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Card as="section" aria-label={title} className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex h-[46px] shrink-0 flex-col justify-center px-[13px]">
        <PanelHeader title={title} linkLabel={linkLabel} href={href} />
      </div>
      <ul className="flex flex-1 flex-col">{children}</ul>
    </Card>
  );
}

function DetailLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-[12px] font-bold text-brand hover:underline">
      Ver detalle →
    </Link>
  );
}

/** "Pedidos que requieren atención" panel. */
export function AttentionOrdersPanel({ orders }: { orders: AttentionOrder[] }) {
  return (
    <ListPanel title="Pedidos que requieren atención" linkLabel="Ver pedidos →" href="/orders">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-1 flex-col gap-[5px] border-b border-line px-[13px] py-2 leading-snug"
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink">{formatOrderIdentity(order)}</p>
            <p className="text-[12px] font-bold text-warning">Hace {order.waitMinutes} min</p>
          </div>
          <p className="text-[12px] text-ink">{formatOrderItems(order.items)}</p>
          {order.note && <p className="text-[12px] font-semibold text-danger">Nota: {order.note}</p>}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold tracking-[0.5px] text-brand">
              {ORDER_STATUS_LABELS[order.status]}
            </p>
            <DetailLink href="/orders" />
          </div>
        </li>
      ))}
    </ListPanel>
  );
}

/** "Solicitudes de cuenta" panel. */
export function BillRequestsPanel({ requests }: { requests: BillRequest[] }) {
  return (
    <ListPanel title="Solicitudes de cuenta" linkLabel="Ver solicitudes →" href="/bill-requests">
      {requests.map((request) => {
        const warning = formatBillWarning(request);
        return (
          // Rows are short, so the detail link shares the warning line to fit.
          <li
            key={request.table}
            className="flex flex-1 flex-col justify-center gap-1 border-b border-line px-[13px] py-2 leading-snug"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-ink">Mesa {request.table}</p>
              <p className="text-[12px] font-bold text-danger">{request.waitMinutes} min esperando</p>
            </div>
            <p className="text-[12px] text-ink">{formatBillMeta(request)}</p>
            <div className="flex items-center justify-between">
              <p
                className={clsx(
                  "text-[11px]",
                  warning.tone === "warning" ? "text-warning" : "text-success",
                )}
              >
                {warning.text}
              </p>
              <DetailLink href="/bill-requests" />
            </div>
          </li>
        );
      })}
    </ListPanel>
  );
}
