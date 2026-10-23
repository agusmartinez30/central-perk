"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import type { ManagedOrder } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";
import {
  canCancelOrder,
  formatOrderTotal,
  getHistoryLabel,
  getPrimaryAction,
  getStatusBadge,
  getHistoryTone,
} from "./orders-view";
import { CustomizationNotice, ORDER_TONE_CLASSES, StatusPill } from "./OrderTags";

type OrderDetailDrawerProps = {
  order: ManagedOrder;
  onClose: () => void;
  onAdvance: (id: number) => void;
  onRequestCancel: (id: number) => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full items-start justify-between text-[12px]">
      <dt className="font-medium text-muted">{label}</dt>
      <dd className="font-bold text-ink">{value}</dd>
    </div>
  );
}

/**
 * "Order Detail · #NNNN": 380px drawer over the right edge with the light "Drawer Backdrop"
 * over the rest of the main area. Escape or the backdrop closes it.
 */
export function OrderDetailDrawer({ order, onClose, onAdvance, onRequestCancel }: OrderDetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const action = getPrimaryAction(order);
  const titleId = `order-detail-${order.id}`;

  useEffect(() => {
    closeRef.current?.focus();
  }, [order.id]);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed top-[72px] right-[380px] bottom-0 left-[220px] z-20 bg-ink/4"
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
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold whitespace-nowrap text-muted">DETALLE DEL PEDIDO</p>
            <h2 id={titleId} className="text-[21px] font-bold whitespace-nowrap text-ink">
              Pedido #{order.id}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar detalle"
            onClick={onClose}
            className="flex size-5 items-center justify-center rounded-sm text-ink hover:text-muted"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <StatusPill {...getStatusBadge(order.status)} />
        <dl className="flex w-full flex-col gap-2 rounded-[10px] bg-cream p-3.5">
          <InfoRow label="Mesa" value={String(order.tableNumber).padStart(2, "0")} />
          <InfoRow label="Cliente" value={order.customer} />
          <InfoRow label="Recibido" value={`Hoy, ${order.receivedAt}`} />
        </dl>
        <h3 className="text-[13px] font-bold text-ink">Productos</h3>
        <ul className="flex w-full flex-col gap-3.5">
          {order.items.map((item) => (
            <li key={item.id} className="flex w-full flex-col gap-3.5">
              <div className="flex w-full items-start justify-between">
                <div className="flex items-start gap-[9px]">
                  <span className="text-[13px] font-bold text-ink">{item.quantity}×</span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-ink">{item.name}</span>
                    {item.variant && <span className="text-[11px] text-muted">{item.variant}</span>}
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-ink">
                  {formatPrice(item.quantity * item.unitPrice)}
                </span>
              </div>
              {item.customization && (
                <CustomizationNotice label="Personalización" value={item.customization} tone="warning" />
              )}
            </li>
          ))}
        </ul>
        {order.note && (
          <div className="flex w-full flex-col gap-[3px] rounded-nav bg-sand p-2.5">
            <p className="text-[9px] font-bold text-muted">NOTA DEL CLIENTE</p>
            <p className="text-[12px] font-medium text-ink">{order.note}</p>
          </div>
        )}
        <div className="flex w-full items-center justify-between">
          <span className="text-[13px] font-semibold text-muted">Total del pedido</span>
          <span className="text-[22px] font-bold text-ink">{formatOrderTotal(order)}</span>
        </div>
        <h3 className="text-[13px] font-bold text-ink">Historial de estado</h3>
        <ol className="flex w-full flex-col gap-2">
          {order.history.map((event, index) => (
            <li key={`${event.kind}-${index}`} className="flex w-full items-center gap-[9px]">
              <span
                aria-hidden="true"
                className={clsx("size-[7px] shrink-0 rounded-full", ORDER_TONE_CLASSES[getHistoryTone(event.kind)].dot)}
              />
              <span className="flex-1 text-[11px] font-semibold text-ink">{getHistoryLabel(event.kind)}</span>
              <time className="text-[10px] font-medium text-muted">{event.at}</time>
            </li>
          ))}
        </ol>
        <div className="flex-1" />
        {action && (
          <button
            type="button"
            onClick={() => onAdvance(order.id)}
            className={clsx(
              "flex h-[42px] w-full shrink-0 items-center justify-center rounded-[9px] text-[12px] font-bold text-white",
              ORDER_TONE_CLASSES[action.tone].solid,
            )}
          >
            {action.label}
          </button>
        )}
        {canCancelOrder(order) && (
          <button
            type="button"
            onClick={() => onRequestCancel(order.id)}
            className="flex h-[38px] w-full shrink-0 items-center justify-center rounded-[9px] text-[12px] font-bold text-danger outline-1 -outline-offset-[0.5px] outline-danger hover:bg-danger-bg"
          >
            Cancelar pedido
          </button>
        )}
      </aside>
    </>
  );
}
