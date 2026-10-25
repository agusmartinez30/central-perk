import type { ReactNode } from "react";
import clsx from "clsx";
import type { ElapsedTone } from "./order-alerts";
import type { OrderTone } from "./orders-view";

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

const BADGE_TONES: Record<OrderTone | ElapsedTone, string> = {
  brand: "bg-brand-wash text-brand",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  neutral: "bg-cream text-muted",
};

/** Small 9px pill of the optimized export: "hace 2 min", "NUEVO", "EN PREPARACIÓN", column counts. */
export function Badge({
  tone,
  children,
  className,
}: {
  tone: OrderTone | ElapsedTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex w-fit shrink-0 items-center rounded-[12px] px-2 py-1 text-[9px] leading-none font-extrabold whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
