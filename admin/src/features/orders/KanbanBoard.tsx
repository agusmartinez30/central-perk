import clsx from "clsx";
import { ChefHat, SearchX, type LucideIcon } from "lucide-react";
import type { ManagedOrder } from "@/mocks/types";
import { Card } from "@/shared/ui";
import {
  formatOrderMeta,
  formatOrderTotal,
  getCardNotice,
  getPrimaryAction,
  getStatusBadge,
  type OrderColumn,
} from "./orders-view";
import { CustomizationNotice, ORDER_TONE_CLASSES, StatusPill } from "./OrderTags";

type OrderCardProps = {
  order: ManagedOrder;
  billRequested: boolean;
  onOpen: (id: number) => void;
  onAdvance: (id: number) => void;
};

/** "Pedido #NNNN · Mesa NN": kitchen card; the order number opens the detail drawer. */
function OrderCard({ order, billRequested, onOpen, onAdvance }: OrderCardProps) {
  const notice = getCardNotice(order, billRequested);
  const action = getPrimaryAction(order);

  return (
    <Card as="article" aria-label={`Pedido #${order.id}`} className="relative flex w-full shrink-0 flex-col gap-[11px] p-3.5 hover:outline-ink/30">
      <div className="flex w-full items-start justify-between">
        <div className="flex flex-col gap-[3px]">
          <h3 className="text-[15px] font-bold whitespace-nowrap text-ink">
            {/* Stretched link: the whole card opens the drawer, the action button sits above it. */}
            <button
              type="button"
              onClick={() => onOpen(order.id)}
              className="text-left after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
            >
              Pedido #{order.id}
            </button>
          </h3>
          <p className="text-[12px] font-medium whitespace-nowrap text-muted">{formatOrderMeta(order)}</p>
        </div>
        <div className="flex flex-col items-end gap-[5px]">
          <time className="text-[11px] font-semibold text-muted">{order.receivedAt}</time>
          <StatusPill {...getStatusBadge(order.status)} />
        </div>
      </div>
      <hr className="h-px w-full border-0 bg-line" />
      <ul className="flex w-full flex-col gap-[11px]">
        {order.items.map((item) => (
          <li key={item.id} className="flex w-full items-start gap-[9px] text-[13px] text-ink">
            <span className="font-bold">{item.quantity}×</span>
            <span className="font-semibold">{item.name}</span>
          </li>
        ))}
      </ul>
      {notice && <CustomizationNotice {...notice} />}
      <div className="flex w-full items-center justify-between">
        <span className="text-[12px] font-semibold text-muted">Total</span>
        <span className="text-[17px] font-bold text-ink">{formatOrderTotal(order)}</span>
      </div>
      {action && (
        <button
          type="button"
          onClick={() => onAdvance(order.id)}
          className={clsx(
            "relative z-[1] flex h-[38px] w-full items-center justify-center gap-2 rounded-[9px] text-white",
            ORDER_TONE_CLASSES[action.tone].solid,
          )}
        >
          <ChefHat size={15} aria-hidden="true" className="shrink-0" />
          <span className="text-[12px] font-bold whitespace-nowrap">{action.label}</span>
        </button>
      )}
    </Card>
  );
}

type KanbanColumnProps = Omit<OrderCardProps, "order" | "billRequested"> & {
  column: OrderColumn;
  billRequestedTables: ReadonlySet<number>;
};

/** "Columna · …": sand column with its accent, title, count and scrolling cards. */
function KanbanColumn({ column, billRequestedTables, ...cardProps }: KanbanColumnProps) {
  return (
    <section
      aria-labelledby={`orders-column-${column.id}`}
      className="flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-[14px] bg-sand p-3"
    >
      <div className="flex w-full shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className={clsx("size-[9px] rounded-full", ORDER_TONE_CLASSES[column.tone].dot)} />
          <h2 id={`orders-column-${column.id}`} className="text-[14px] font-bold whitespace-nowrap text-ink">
            {column.title}
          </h2>
        </div>
        <span className="flex size-6 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-ink">
          <span className="sr-only">Pedidos: </span>
          {column.orders.length}
        </span>
      </div>
      <div className="-m-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-1">
        {column.orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            billRequested={billRequestedTables.has(order.tableNumber)}
            {...cardProps}
          />
        ))}
      </div>
    </section>
  );
}

export type BoardEmptyState = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

type KanbanBoardProps = Omit<KanbanColumnProps, "column"> & {
  columns: OrderColumn[];
  emptyState: BoardEmptyState | null;
};

/** "Kanban Board": one column per kitchen stage, or an empty state when nothing matches. */
export function KanbanBoard({ columns, emptyState, ...columnProps }: KanbanBoardProps) {
  if (emptyState) {
    const EmptyIcon = emptyState.icon ?? SearchX;
    return (
      <Card className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
        <EmptyIcon size={28} aria-hidden="true" className="text-muted" />
        <p className="text-[14px] font-bold text-ink">{emptyState.title}</p>
        <p className="text-[12px] text-muted">{emptyState.description}</p>
        {emptyState.action && (
          <button
            type="button"
            onClick={emptyState.action.onClick}
            className="mt-1 text-[12px] font-bold text-brand hover:underline"
          >
            {emptyState.action.label}
          </button>
        )}
      </Card>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 gap-3">
      {columns.map((column) => (
        <KanbanColumn key={column.id} column={column} {...columnProps} />
      ))}
    </div>
  );
}
