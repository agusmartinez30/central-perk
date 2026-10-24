import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** "Breadcrumb" of every 09 page. */
export const TABLE_QR_BREADCRUMB = "Mesas / Códigos QR";

type PageHeaderProps = { title: string; subtitle: string; actions?: ReactNode };

/** "Page Header": 9px breadcrumb → 11px, 25px title, 11px subtitle → 12px. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex w-full shrink-0 items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold whitespace-nowrap text-brand">{TABLE_QR_BREADCRUMB}</p>
        <h2 className="text-[25px] font-bold whitespace-nowrap text-ink">{title}</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

type HeaderButtonProps = {
  label: string;
  icon: LucideIcon;
  tone: "primary" | "neutral";
  onClick: () => void;
};

/** "Action · Imprimir códigos QR / Nueva mesa": 40px buttons, 9px label → 12px. */
export function HeaderButton({ label, icon: Icon, tone, onClick }: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex h-10 items-center gap-[7px] rounded-field px-[13px] outline-1 -outline-offset-[0.5px]",
        tone === "primary" ? "bg-brand text-white outline-brand hover:bg-brand/92" : "bg-surface text-ink outline-line hover:bg-cream",
      )}
    >
      <Icon size={14} aria-hidden="true" className="shrink-0" />
      <span className="text-[12px] font-bold whitespace-nowrap">{label}</span>
    </button>
  );
}

/** "Metrics": 70px white cards, 10px label → 11px, 25px value. */
export function MetricCards({ items }: { items: readonly { label: string; value: number }[] }) {
  return (
    <dl className="flex h-[70px] w-full shrink-0 gap-[9px]">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-1 flex-col gap-1 rounded-card bg-surface px-[15px] py-[13px] outline-1 -outline-offset-[0.5px] outline-line"
        >
          <dt className="text-[11px] font-semibold whitespace-nowrap text-muted">{item.label}</dt>
          <dd className="text-[25px] leading-none font-bold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type ChipTone = "success" | "brand" | "warning" | "neutral";

const CHIP_TONES: Record<ChipTone, { box: string; dot: string }> = {
  success: { box: "bg-success-bg text-success", dot: "bg-success" },
  brand: { box: "bg-brand-wash text-brand", dot: "bg-brand" },
  warning: { box: "bg-warning-bg text-warning", dot: "bg-warning" },
  neutral: { box: "bg-sand text-muted", dot: "bg-muted" },
};

/** "Configuration / Session / QR Status": 26px pill with a 6px dot, 9px label → 11px. */
export function StatusChip({ label, tone, className }: { label: string; tone: ChipTone; className?: string }) {
  const colors = CHIP_TONES[tone];
  return (
    <span className={clsx("flex h-[26px] shrink-0 items-center gap-1.5 rounded-[13px] px-[9px]", colors.box, className)}>
      <span aria-hidden="true" className={clsx("size-1.5 shrink-0 rounded-full", colors.dot)} />
      <span className="text-[11px] font-bold whitespace-nowrap">{label}</span>
    </span>
  );
}

type BarButtonProps = { label: string; tone: "primary" | "neutral"; onClick: () => void };

/** "Editor Action · Cancelar / Guardar mesa": 32px buttons, 9px labels → 11px. */
export function BarButton({ label, tone, onClick }: BarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex h-8 items-center rounded-nav px-3 text-[11px] font-bold whitespace-nowrap outline-1 -outline-offset-[0.5px]",
        tone === "primary" ? "bg-brand text-white outline-brand hover:bg-brand/92" : "bg-surface text-ink outline-line hover:bg-cream",
      )}
    >
      {label}
    </button>
  );
}

type SwitchProps = { checked: boolean; label: string; onChange: (checked: boolean) => void };

/** "Enabled Toggle": 42×24 switch with an 18px knob, brand when on. */
export function Switch({ checked, label, onChange }: SwitchProps) {
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
