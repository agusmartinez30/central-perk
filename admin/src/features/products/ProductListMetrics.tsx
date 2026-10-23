import type { ProductMetrics } from "./product-catalog";

const METRIC_CARDS = [
  { id: "published", label: "Publicados", card: "bg-brand-wash", dot: "bg-brand" },
  { id: "available", label: "Disponibles", card: "bg-success-bg", dot: "bg-success" },
  { id: "unavailable", label: "No disponibles", card: "bg-warning-bg", dot: "bg-warning" },
] as const;

/** "Product List Metrics": three tinted cards over the whole catalogue. */
export function ProductListMetrics({ metrics }: { metrics: ProductMetrics }) {
  return (
    <dl className="flex h-[74px] w-full shrink-0 gap-2.5">
      {METRIC_CARDS.map((card) => (
        <div
          key={card.id}
          className={`flex flex-1 flex-col gap-[5px] rounded-tile px-[13px] py-[11px] outline-1 -outline-offset-[0.5px] outline-line ${card.card}`}
        >
          <dt className="flex items-center justify-between">
            <span className="text-[11px] font-bold whitespace-nowrap text-muted">{card.label}</span>
            <span aria-hidden="true" className={`size-[7px] rounded-full ${card.dot}`} />
          </dt>
          <dd className="text-[23px] font-bold text-ink">{metrics[card.id]}</dd>
        </div>
      ))}
    </dl>
  );
}
