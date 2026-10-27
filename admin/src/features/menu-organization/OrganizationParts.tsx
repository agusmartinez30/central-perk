import clsx from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";
import { Clock3, GripVertical, ImageOff, Tags, type LucideIcon } from "lucide-react";
import type { MetricItem } from "@/features/categories/category-catalog";
import type { OrganizationTab } from "./organization-state";

/** "Breadcrumb" of every 08 page, shown uppercase. */
export const ORGANIZATION_BREADCRUMB = "Carta digital / Categorías y momentos";

type PageHeaderProps = { title: string; subtitle: string; actions?: ReactNode };

/** "Moments Header" / "Categories Header": 9px uppercase breadcrumb → 11px, 25px title, 10px subtitle → 12px. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex min-h-[68px] w-full shrink-0 items-center justify-between gap-4">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[11px] font-bold tracking-[0.6px] whitespace-nowrap text-brand uppercase">
          {ORGANIZATION_BREADCRUMB}
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

type VisibilitySwitchProps = { checked: boolean; label: string; onChange: (checked: boolean) => void };

/** "Visibility" / "Visibility Toggle": 42×24 switch with an 18px knob, brand when on. */
export function VisibilitySwitch({ checked, label, onChange }: VisibilitySwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "flex h-6 w-[42px] shrink-0 items-center rounded-xl p-[3px] transition-colors",
        checked ? "justify-end bg-brand" : "justify-start bg-line",
      )}
    >
      <span aria-hidden="true" className="size-[18px] rounded-full bg-surface" />
    </button>
  );
}

type EditorStatusBarProps = { label: string; dirty: boolean; children: ReactNode };

/** "Editor Status Bar": 44px amber bar while there are unsaved changes (neutral otherwise, invented). */
export function EditorStatusBar({ label, dirty, children }: EditorStatusBarProps) {
  return (
    <div
      className={clsx(
        "flex h-11 w-full shrink-0 items-center justify-between rounded-[10px] px-3.5",
        dirty ? "bg-warning-bg" : "bg-surface outline-1 -outline-offset-[0.5px] outline-line",
      )}
    >
      <p role="status" className={clsx("text-[12px] font-bold whitespace-nowrap", dirty ? "text-warning" : "text-muted")}>
        {label}
      </p>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

type BarButtonProps = {
  label: string;
  tone: "primary" | "neutral" | "danger";
  disabled?: boolean;
  onClick: () => void;
};

/** "Action · Descartar / Guardar cambios / Archivar": 32px buttons, 9px labels → 11px. */
export function BarButton({ label, tone, disabled = false, onClick }: BarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex h-8 items-center rounded-nav px-3 text-[11px] font-bold whitespace-nowrap outline-1 -outline-offset-[0.5px] disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary" && "bg-brand text-white outline-brand enabled:hover:bg-brand/92",
        tone === "neutral" && "bg-surface text-ink outline-line enabled:hover:bg-cream",
        tone === "danger" && "bg-surface text-danger outline-line enabled:hover:bg-danger-bg",
      )}
    >
      {label}
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
