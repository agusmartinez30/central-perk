import clsx from "clsx";
import { CreditCard, Landmark, ListChecks, ShieldCheck, type LucideIcon } from "lucide-react";
import type { SettingsTab } from "./payments-state";

const TABS: readonly { id: SettingsTab | "security"; label: string; icon: LucideIcon }[] = [
  { id: "methods", label: "Medios de cobro", icon: CreditCard },
  { id: "modes", label: "Modalidades", icon: ListChecks },
  { id: "bank", label: "Datos bancarios", icon: Landmark },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
];

type PaymentSettingsNavigationProps = {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

/**
 * "Payment Settings Navigation": section tabs of the settings workspace. "Seguridad" has no
 * design yet, so it is shown but disabled.
 */
export function PaymentSettingsNavigation({ tab, onTabChange }: PaymentSettingsNavigationProps) {
  return (
    <nav
      aria-label="Secciones de pagos"
      className="flex h-full w-[176px] shrink-0 flex-col gap-[5px] rounded-card bg-surface p-2 outline-1 -outline-offset-[0.5px] outline-line"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = id === tab;
        const disabled = id === "security";
        return (
          <button
            key={id}
            type="button"
            aria-current={active ? "true" : undefined}
            disabled={disabled}
            title={disabled ? "Próximamente" : undefined}
            onClick={() => {
              if (id !== "security") onTabChange(id);
            }}
            className={clsx(
              "flex h-[42px] w-full shrink-0 items-center gap-[9px] rounded-nav px-2.5 text-left",
              active ? "bg-brand text-white" : "bg-surface text-ink enabled:hover:bg-cream",
              disabled && "cursor-not-allowed",
            )}
          >
            <Icon size={14} aria-hidden="true" className={clsx("shrink-0", active ? "text-white" : "text-muted")} />
            <span className={clsx("text-[12px] whitespace-nowrap", active ? "font-bold" : "font-semibold")}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
