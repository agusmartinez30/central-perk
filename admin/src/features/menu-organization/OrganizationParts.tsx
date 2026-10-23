import clsx from "clsx";
import Image from "next/image";
import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";
import type { OrganizationTab } from "./organization-state";

/** "Breadcrumb" of every 08 page. */
export const ORGANIZATION_BREADCRUMB = "Carta digital / Categorías y momentos";

type PageHeaderProps = { title: string; subtitle: string; actions?: ReactNode };

/** "Page Header": 9px breadcrumb → 11px, 25px title, 11px subtitle → 12px. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex w-full shrink-0 items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold whitespace-nowrap text-brand">{ORGANIZATION_BREADCRUMB}</p>
        <h2 className="text-[25px] font-bold whitespace-nowrap text-ink">{title}</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

type MetricCardsProps = { items: readonly { label: string; value: number }[]; height: "74" | "66" };

/** "Summary Metrics": white cards, 10px label → 11px, 26px value. 08A is 74px tall, 08C 66px. */
export function MetricCards({ items, height }: MetricCardsProps) {
  return (
    <dl className={clsx("flex w-full shrink-0 gap-2.5", height === "74" ? "h-[74px]" : "h-[66px]")}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 flex-col gap-1 rounded-card bg-surface px-4 py-3.5 outline-1 -outline-offset-[0.5px] outline-line"
        >
          <dt className="text-[11px] font-semibold whitespace-nowrap text-muted">{item.label}</dt>
          <dd className="text-[26px] leading-none font-bold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const TABS: readonly { id: OrganizationTab; label: string }[] = [
  { id: "moments", label: "Momentos de consumo" },
  { id: "categories", label: "Categorías" },
];

/** "Primary Tabs" / "Category Tabs": 480×44 segmented control, 11px labels → 12px. */
export function OrganizationTabs({ active, onChange }: { active: OrganizationTab; onChange: (tab: OrganizationTab) => void }) {
  return (
    <div role="tablist" aria-label="Organización de la carta" className="flex h-11 w-[480px] shrink-0 gap-1 rounded-[10px] bg-surface p-1 outline-1 -outline-offset-[0.5px] outline-line">
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex flex-1 items-center justify-center rounded-[7px] text-[12px] font-bold whitespace-nowrap",
              selected ? "bg-brand text-white" : "text-muted hover:bg-cream hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
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
