import type { ReactNode } from "react";
import clsx from "clsx";
import { AlarmClock, Eye, EyeOff, ListFilter, Search, type LucideIcon } from "lucide-react";
import type { QuickFilter } from "./order-alerts";

type ChipProps = {
  icon: LucideIcon;
  pressed: boolean;
  onClick: () => void;
  className: string;
  iconClassName: string;
  children: ReactNode;
};

/** 34px toolbar chip with a 14px icon. */
function Chip({ icon: Icon, pressed, onClick, className, iconClassName, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        "flex h-[34px] shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[11px] font-bold whitespace-nowrap",
        className,
      )}
    >
      <Icon size={14} aria-hidden="true" className={clsx("shrink-0", iconClassName)} />
      {children}
    </button>
  );
}

const OUTLINED = "bg-surface text-muted outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream";

type OrderToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  delayedCount: number;
  showDelivered: boolean;
  onShowDeliveredChange: (show: boolean) => void;
};

/** "Barra de herramientas compacta": unified search, quick filters, delivered visibility, sync note. */
export function OrderToolbar({
  query,
  onQueryChange,
  quickFilter,
  onQuickFilterChange,
  delayedCount,
  showDelivered,
  onShowDeliveredChange,
}: OrderToolbarProps) {
  const allActive = quickFilter === "all";
  const delayedActive = quickFilter === "delayed";
  return (
    <div
      role="toolbar"
      aria-label="Filtros de pedidos"
      className="flex h-[46px] w-full shrink-0 items-center gap-2 rounded-[10px] bg-surface px-2 py-1.5 outline-1 -outline-offset-[0.5px] outline-line"
    >
      <label className="flex h-[34px] w-[310px] shrink-0 items-center gap-2 rounded-[7px] bg-cream px-2.5 focus-within:outline-2 focus-within:-outline-offset-1 focus-within:outline-brand">
        <Search size={15} aria-hidden="true" className="shrink-0 text-muted" />
        <span className="sr-only">Buscar por pedido, mesa o cliente</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Pedido, mesa o cliente…"
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      <Chip
        icon={ListFilter}
        pressed={allActive}
        onClick={() => onQuickFilterChange("all")}
        className={allActive ? "bg-brand-wash text-brand" : OUTLINED}
        iconClassName={allActive ? "text-brand" : "text-muted"}
      >
        Todos
      </Chip>
      <Chip
        icon={AlarmClock}
        pressed={delayedActive}
        onClick={() => onQuickFilterChange(delayedActive ? "all" : "delayed")}
        className={clsx(
          "bg-danger-bg text-danger hover:bg-danger-bg/70",
          delayedActive && "outline-1 -outline-offset-[0.5px] outline-danger",
        )}
        iconClassName="text-danger"
      >
        Demorados {delayedCount}
      </Chip>
      <Chip
        icon={showDelivered ? Eye : EyeOff}
        pressed={showDelivered}
        onClick={() => onShowDeliveredChange(!showDelivered)}
        className={OUTLINED}
        iconClassName="text-muted"
      >
        {showDelivered ? "Entregados visibles" : "Entregados ocultos"}
      </Chip>
      <p className="ml-auto pr-6 text-[10px] whitespace-nowrap text-muted" aria-live="polite">
        Actualizado ahora
      </p>
    </div>
  );
}
