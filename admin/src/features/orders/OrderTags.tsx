import clsx from "clsx";
import { SlidersHorizontal } from "lucide-react";
import type { CardNotice, OrderTone } from "./orders-view";

/** Wash, text, dot and solid-button classes of each order tone. */
export const ORDER_TONE_CLASSES: Record<OrderTone, { wash: string; text: string; dot: string; solid: string }> = {
  brand: { wash: "bg-brand-wash", text: "text-brand", dot: "bg-brand", solid: "bg-brand hover:bg-brand/92" },
  warning: {
    wash: "bg-warning-bg",
    text: "text-warning",
    dot: "bg-warning",
    solid: "bg-warning hover:bg-warning/92",
  },
  success: {
    wash: "bg-success-bg",
    text: "text-success",
    dot: "bg-success",
    solid: "bg-success hover:bg-success/92",
  },
  danger: { wash: "bg-danger-bg", text: "text-danger", dot: "bg-danger", solid: "bg-danger hover:bg-danger/92" },
};

/** "Card Status" / "Drawer Status": 26px pill with a 6px dot. */
export function StatusPill({ label, tone }: { label: string; tone: OrderTone }) {
  const classes = ORDER_TONE_CLASSES[tone];
  return (
    <span className={clsx("inline-flex h-[26px] w-fit items-center gap-1.5 rounded-[13px] px-2.5", classes.wash)}>
      <span aria-hidden="true" className={clsx("size-1.5 shrink-0 rounded-full", classes.dot)} />
      <span className={clsx("text-[11px] font-bold whitespace-nowrap", classes.text)}>{label}</span>
    </span>
  );
}

/** "Card Customization" / "Customization": tinted note with the customization icon. */
export function CustomizationNotice({ label, value, tone }: CardNotice) {
  const classes = ORDER_TONE_CLASSES[tone];
  return (
    <div className={clsx("flex w-full items-start gap-2 rounded-nav px-2.5 py-2", classes.wash)}>
      <SlidersHorizontal size={14} aria-hidden="true" className={clsx("shrink-0", classes.text)} />
      <div className="flex flex-1 flex-col gap-0.5">
        <p className={clsx("text-[10px] font-bold", classes.text)}>{label}</p>
        <p className="w-full text-[11px] font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}
