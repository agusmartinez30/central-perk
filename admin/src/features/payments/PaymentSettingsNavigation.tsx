import clsx from "clsx";
import type { SettingsTab } from "./payments-state";

/** Active tab widths of the exports: the underline spans more than the label; inactive tabs fit it. */
const TABS: readonly { id: SettingsTab | "security"; label: string; width?: string }[] = [
  { id: "methods", label: "Métodos y modalidades", width: "w-[175px]" },
  { id: "bank", label: "Datos bancarios", width: "w-[130px]" },
  { id: "security", label: "Seguridad" },
];

type PaymentSettingsNavigationProps = {
  tab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
};

/**
 * "Navegación secundaria horizontal": section tabs of the payment settings. "Seguridad" has no
 * design yet, so it is shown but disabled.
 */
export function PaymentSettingsNavigation({ tab, onTabChange }: PaymentSettingsNavigationProps) {
  return (
    <nav
      aria-label="Secciones de pagos"
      className="mt-2 flex h-12 w-full shrink-0 items-end gap-6 border-b border-line bg-surface px-1"
    >
      {TABS.map(({ id, label, width }) => {
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
              "-mb-px flex h-12 shrink-0 items-center px-2 text-left text-[12px] whitespace-nowrap",
              active && width,
              active
                ? "border-b-2 border-brand pt-0.5 font-extrabold text-brand"
                : "font-semibold text-muted enabled:hover:text-ink",
              disabled && "cursor-not-allowed",
            )}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
