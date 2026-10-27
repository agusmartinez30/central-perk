import clsx from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";
import { Clock3, GripVertical, ImageOff, Tags, type LucideIcon } from "lucide-react";
import type { MetricItem } from "@/features/categories/category-catalog";
import type { OrganizationTab } from "./organization-state";

/** "Breadcrumb" of every 08 page, shown uppercase. */
export const ORGANIZATION_BREADCRUMB = "Carta digital / Categorías y momentos";

type PageHeaderProps = { title: string; subtitle: string; actions?: ReactNode; breadcrumb?: string };

/**
 * "Moments Header" / "Categories Header" / "Studio Header": 9px uppercase breadcrumb → 11px,
 * 25px title, 10px subtitle → 12px.
 */
export function PageHeader({ title, subtitle, actions, breadcrumb = ORGANIZATION_BREADCRUMB }: PageHeaderProps) {
  return (
    <header className="flex min-h-[68px] w-full shrink-0 items-center justify-between gap-4">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[11px] font-bold tracking-[0.6px] whitespace-nowrap text-brand uppercase">
          {breadcrumb}
        </p>
        <h2 className="text-[25px] leading-tight font-bold whitespace-nowrap text-ink">{title}</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

type HeaderActionProps = { label: string; icon: LucideIcon; tone: "primary" | "neutral"; onClick: () => void };

/** "Create Moment" / "Create Category": 38px brand button (10px label → 12px); neutral for the preview entry. */
export function HeaderAction({ label, icon: Icon, tone, onClick }: HeaderActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex h-[38px] items-center gap-[7px] rounded-field px-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        tone === "primary"
          ? "bg-brand text-white hover:bg-brand/92"
          : "bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream",
      )}
    >
      <Icon size={14} aria-hidden="true" className="shrink-0" />
      <span className="text-[12px] font-bold whitespace-nowrap">{label}</span>
    </button>
  );
}

/** Value colors of each strip, in metric order (08A ends in ink, 08C in amber "Vacías"). */
export const MOMENT_METRIC_TONES = ["text-brand", "text-success", "text-ink"] as const;
export const CATEGORY_METRIC_TONES = ["text-brand", "text-success", "text-warning"] as const;

type MetricStripProps = { label: string; items: readonly MetricItem[]; tones: readonly string[] };

/**
 * "Compact Moment Metrics" / "Compact Category Metrics": one white 62px strip split in three,
 * 22px value beside a 9px label → 11px and an 8px detail line → 11px.
 */
export function MetricStrip({ label, items, tones }: MetricStripProps) {
  return (
    <ul
      aria-label={label}
      className="flex h-[62px] w-full shrink-0 divide-x divide-line rounded-[10px] bg-surface outline-1 -outline-offset-[0.5px] outline-line"
    >
      {items.map((item, index) => (
        <li key={item.label} className="flex min-w-0 flex-1 items-center gap-2.5 px-4">
          <span className={clsx("text-[22px] leading-tight font-bold", tones[index] ?? "text-ink")}>{item.value}</span>
          <span className="flex min-w-0 flex-col gap-px">
            <span className="text-[11px] font-bold whitespace-nowrap text-ink">{item.label}</span>
            <span className="truncate text-[11px] text-muted">{item.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const TABS: readonly { id: OrganizationTab; label: string; icon: LucideIcon }[] = [
  { id: "moments", label: "Momentos de consumo", icon: Clock3 },
  { id: "categories", label: "Categorías", icon: Tags },
];

type OrganizationTabsProps = {
  active: OrganizationTab;
  onChange: (tab: OrganizationTab) => void;
  /** "Ordering Help" at the end of the row. */
  hint: string;
  /** Tools between the tabs and the hint (08C search). */
  children?: ReactNode;
};

/**
 * "Tabs and Controls": compact sand segmented tabs (white raised tab with its icon when
 * selected, 9px labels → 11px) and the ordering hint with a grip (8px → 11px).
 */
export function OrganizationTabs({ active, onChange, hint, children }: OrganizationTabsProps) {
  return (
    <div className="flex h-[38px] w-full shrink-0 items-center gap-2.5">
      <div role="tablist" aria-label="Organización de la carta" className="flex h-full shrink-0 gap-[3px] rounded-field bg-sand p-[3px]">
        {TABS.map(({ id, label, icon: Icon }) => {
          const selected = id === active;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(id)}
              className={clsx(
                "flex h-full items-center gap-1.5 rounded-[7px] px-[13px] text-[11px] font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-brand",
                selected ? "bg-surface text-brand shadow-[0_1px_3px_#10101010]" : "text-muted hover:text-ink",
              )}
            >
              {selected && <Icon size={12} aria-hidden="true" className="shrink-0" />}
              {label}
            </button>
          );
        })}
      </div>
      {children}
      <p className="ml-auto flex items-center gap-[7px] text-[11px] whitespace-nowrap text-muted">
        <GripVertical size={13} aria-hidden="true" className="shrink-0" />
        {hint}
      </p>
    </div>
  );
}

type InlineVisibilityProps = {
  /** Shown value: the requested one while the save is pending. */
  visible: boolean;
  /** "Visible" / "Oculto" / "Oculta" / "Actualizando…". */
  label: string;
  pending: boolean;
  /** "No se pudo guardar" after a failed save. */
  error?: string;
  ariaLabel: string;
  /** Label before the switch (08A cards) or after it (08C rows). */
  labelSide: "start" | "end";
  onChange: (visible: boolean) => void;
};

const INLINE_VISIBILITY_TONES = { visible: "text-success", hidden: "text-warning", pending: "text-brand" } as const;

/**
 * "Visibility Toggle" of 08A cards and 08C rows: 30×18 switch wired to the async save, disabled
 * and busy while pending, with the inline error of a failed save.
 */
export function InlineVisibility({ visible, label, pending, error, ariaLabel, labelSide, onChange }: InlineVisibilityProps) {
  const tone = INLINE_VISIBILITY_TONES[pending ? "pending" : visible ? "visible" : "hidden"];
  const text = (
    <span aria-hidden="true" className={clsx("text-[11px] font-bold whitespace-nowrap", tone)}>
      {label}
    </span>
  );
  return (
    <div className={clsx("flex shrink-0 flex-col gap-[3px]", labelSide === "start" ? "items-end" : "items-start")}>
      <span className="flex items-center gap-[7px]">
        {labelSide === "start" && text}
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          aria-label={ariaLabel}
          aria-busy={pending || undefined}
          disabled={pending}
          onClick={() => onChange(!visible)}
          className={clsx(
            "flex h-[18px] w-[30px] shrink-0 items-center rounded-[9px] p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            visible ? "justify-end bg-brand" : "justify-start bg-[#D4D0C8]",
            pending && "cursor-progress",
          )}
        >
          <span aria-hidden="true" className="size-3.5 rounded-full bg-surface" />
        </button>
        {labelSide === "end" && text}
      </span>
      {error && <span className="text-[11px] font-bold whitespace-nowrap text-danger">{error}</span>}
    </div>
  );
}

type OrderStepProps = {
  label: string;
  icon: LucideIcon;
  disabled: boolean;
  /** 08C "Keyboard Reorder": stacked 10px chevrons. */
  compact?: boolean;
  onClick: () => void;
};

/** "Move Up" / "Move Down" chevrons of the 08A cards and 08C rows. */
export function OrderStep({ label, icon: Icon, disabled, compact = false, onClick }: OrderStepProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center text-ink hover:bg-sand focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:text-line disabled:hover:bg-transparent",
        compact ? "h-4 w-5 rounded-[4px]" : "size-6 rounded-[6px]",
      )}
    >
      <Icon size={compact ? 10 : 13} aria-hidden="true" />
    </button>
  );
}

type CoverImageProps = { src?: string; alt: string; sizes: string; className?: string; children?: ReactNode };

/** Background photo of a moment ("Moment Cover", "Cover Preview", "Preview Moment Cover"). */
export function CoverImage({ src, alt, sizes, className, children }: CoverImageProps) {
  return (
    <div className={clsx("relative shrink-0 overflow-hidden bg-sand", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized={src.startsWith("blob:")} className="object-cover" />
      ) : (
        <span role="img" aria-label={`${alt} (sin imagen)`} className="flex size-full items-center justify-center text-muted">
          <ImageOff size={22} aria-hidden="true" />
        </span>
      )}
      {children}
    </div>
  );
}
