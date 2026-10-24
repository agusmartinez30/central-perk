import clsx from "clsx";
import { ChefHat, SearchX, WalletCards, type LucideIcon } from "lucide-react";
import type { ManagedTable } from "@/mocks/types";
import { Card } from "@/shared/ui";
import { InfoTag, StatusBadge, TONE_CLASSES } from "./TableTags";
import {
  formatAccountTotal,
  formatOrderCount,
  formatTableLabel,
  getCardAlert,
  getPaymentPreferenceLabel,
  getStatusBadge,
} from "./tables-view";

/** Card grid or one row per table (the 02 "Lista" view). */
export type TableBoardView = "grid" | "list";

const CARDS_PER_ROW = 4;

/** Kitchen "Card Alert" or bill "Payment Preference", whichever applies. */
function TableExtraTag({ table }: { table: ManagedTable }) {
  const alert = getCardAlert(table);
  if (alert) return <InfoTag icon={ChefHat} label={alert} tone="warning" />;
  const payment = getPaymentPreferenceLabel(table);
  if (payment) return <InfoTag icon={WalletCards} label={payment} tone="danger" />;
  return null;
}

type TableItemProps = {
  table: ManagedTable;
  selected: boolean;
  onSelect: (id: string) => void;
};

/** "Mesa NN" card of the grid view. */
function TableCard({ table, selected, onSelect }: TableItemProps) {
  const badge = getStatusBadge(table);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(table.id)}
      className={clsx(
        "flex min-h-0 flex-1 basis-0 flex-col gap-3 rounded-[14px] bg-surface p-4 text-left transition-shadow hover:shadow-auth",
        selected
          ? clsx("outline-2 -outline-offset-1", TONE_CLASSES[badge.tone].outline)
          : "outline-1 -outline-offset-[0.5px] outline-line",
      )}
    >
      <span className="flex w-full items-center justify-between">
        <span className="text-[17px] font-bold whitespace-nowrap text-ink">
          {formatTableLabel(table.number)}
        </span>
        <StatusBadge {...badge} />
      </span>
      <span className="flex w-full items-center justify-between">
        <span className="text-[12px] whitespace-nowrap text-muted">{formatOrderCount(table)}</span>
        <span className="text-[17px] font-bold whitespace-nowrap text-ink">
          {formatAccountTotal(table)}
        </span>
      </span>
      <span aria-hidden="true" className="h-px w-full shrink-0 bg-line" />
      <TableExtraTag table={table} />
    </button>
  );
}

/** Row of the list view (not in the export): the card data laid out in columns. */
function TableRow({ table, selected, onSelect }: TableItemProps) {
  return (
    <li className="border-b border-line last:border-b-0">
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(table.id)}
        className={clsx(
          "flex h-[46px] w-full items-center gap-4 px-4 text-left hover:bg-cream",
          selected && "bg-cream",
        )}
      >
        <span className="w-[88px] shrink-0 text-[15px] font-bold whitespace-nowrap text-ink">
          {formatTableLabel(table.number)}
        </span>
        <span className="w-[150px] shrink-0">
          <StatusBadge {...getStatusBadge(table)} />
        </span>
        <span className="w-[130px] shrink-0 text-[12px] whitespace-nowrap text-muted">
          {formatOrderCount(table)}
        </span>
        <span className="flex-1">
          <TableExtraTag table={table} />
        </span>
        <span className="text-[15px] font-bold whitespace-nowrap text-ink">
          {formatAccountTotal(table)}
        </span>
      </button>
    </li>
  );
}

type TableBoardProps = {
  tables: ManagedTable[];
  view: TableBoardView;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Shown when `tables` is empty. */
  emptyState: {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  };
};

/** "Table Grid" (four cards per row, three rows) or its list alternative. */
export function TableBoard({ tables, view, selectedId, onSelect, emptyState }: TableBoardProps) {
  if (tables.length === 0) {
    const EmptyIcon = emptyState.icon ?? SearchX;
    return (
      <Card className="flex w-full flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
        <EmptyIcon size={28} aria-hidden="true" className="text-muted" />
        <p className="text-[17px] font-bold text-ink">{emptyState.title}</p>
        <p className="text-[13px] text-muted">{emptyState.description}</p>
        {emptyState.action && (
          <button
            type="button"
            onClick={emptyState.action.onClick}
            className="mt-1 text-[13px] font-bold text-brand hover:underline"
          >
            {emptyState.action.label}
          </button>
        )}
      </Card>
    );
  }

  if (view === "list") {
    return (
      <Card as="section" aria-label="Lista de mesas" className="w-full overflow-hidden">
        <ul>
          {tables.map((table) => (
            <TableRow key={table.id} table={table} selected={table.id === selectedId} onSelect={onSelect} />
          ))}
        </ul>
      </Card>
    );
  }

  // Flex rows ("Fila de mesas") instead of CSS grid columns: as in the export, a card with a
  // long badge ("Cuenta solicitada") grows a little and its neighbours shrink.
  const rows: ManagedTable[][] = [];
  for (let index = 0; index < tables.length; index += CARDS_PER_ROW) {
    rows.push(tables.slice(index, index + CARDS_PER_ROW));
  }

  return (
    <section
      aria-label="Mesas"
      className="grid min-h-[480px] w-full flex-1 grid-rows-[repeat(3,minmax(0,1fr))] gap-2.5"
    >
      {rows.map((row, index) => (
        <div key={index} className="flex min-h-0 gap-2.5">
          {row.map((table) => (
            <TableCard key={table.id} table={table} selected={table.id === selectedId} onSelect={onSelect} />
          ))}
          {/* Keep the four-column rhythm when the last row is incomplete. */}
          {Array.from({ length: CARDS_PER_ROW - row.length }, (_, filler) => (
            <span key={`filler-${filler}`} aria-hidden="true" className="flex-1 basis-0" />
          ))}
        </div>
      ))}
    </section>
  );
}
