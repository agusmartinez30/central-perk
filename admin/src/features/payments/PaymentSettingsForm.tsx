import { useId } from "react";
import clsx from "clsx";
import {
  Banknote,
  CircleAlert,
  CircleEllipsis,
  ConciergeBell,
  CreditCard,
  Landmark,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { AcceptedPaymentMethod, BillPaymentMethod, PaymentSettings } from "@/mocks/types";
import { PAYMENT_METHOD_OPTIONS, REQUEST_MODE_OPTIONS, TRANSFER_MODE_RULE } from "./payment-settings";

export const METHOD_ICONS: Record<AcceptedPaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  other: CircleEllipsis,
};

export const REQUEST_MODE_ICONS: Record<BillPaymentMethod, LucideIcon> = {
  table: ConciergeBell,
  register: Store,
  transfer: Landmark,
};

type SettingRowProps = {
  label: string;
  description: string;
  icon: LucideIcon;
  checked: boolean;
  /** Locked switches stay on (the last enabled method). */
  locked?: boolean;
  /** Method rows are 72px tall, request mode rows 64px. */
  size: "method" | "mode";
  onToggle: () => void;
};

/** "Efectivo · A" … row: 34px icon, name, description and a 42×24 switch, divided by a rule. */
function SettingRow({ label, description, icon: Icon, checked, locked, size, onToggle }: SettingRowProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <div
      className={clsx(
        "flex w-full shrink-0 items-center justify-between gap-3 border-b border-line px-1",
        size === "method" ? "h-[72px]" : "h-16",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={clsx(
            "flex size-[34px] shrink-0 items-center justify-center rounded-nav",
            checked ? "bg-brand-wash text-brand" : "bg-cream text-muted",
          )}
        >
          <Icon size={15} />
        </span>
        <div className="flex min-w-0 flex-col gap-[3px]">
          <p id={labelId} className="text-[13px] font-bold whitespace-nowrap text-ink">
            {label}
          </p>
          <p id={descriptionId} className="text-[11px] font-medium text-muted">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={locked}
        title={locked ? "Debe quedar al menos un medio de cobro habilitado" : undefined}
        onClick={onToggle}
        className={clsx(
          "flex h-6 w-[42px] shrink-0 items-center rounded-[12px] p-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed",
          checked ? "justify-end bg-brand" : "justify-start bg-sand",
        )}
      >
        <span aria-hidden="true" className="size-[18px] rounded-full bg-surface" />
      </button>
    </div>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-1 pb-3">
      <h3 id={id} className="text-[14px] font-extrabold whitespace-nowrap text-ink">
        {title}
      </h3>
      <p className="text-[11px] font-medium text-muted">{description}</p>
    </div>
  );
}

type PaymentSettingsFormProps = {
  draft: PaymentSettings;
  lockedMethods: AcceptedPaymentMethod[];
  /** "Por transferencia" is on while the Transferencia method is off. */
  transferModeBlocked: boolean;
  onToggleMethod: (method: AcceptedPaymentMethod) => void;
  onToggleRequestMode: (mode: BillPaymentMethod) => void;
};

/**
 * "Configuración · A" of the "Métodos y modalidades" tab: "Medios de cobro aceptados" and
 * "Modalidades para solicitar la cuenta" in one card.
 */
export function PaymentSettingsForm({
  draft,
  lockedMethods,
  transferModeBlocked,
  onToggleMethod,
  onToggleRequestMode,
}: PaymentSettingsFormProps) {
  const methodsTitleId = useId();
  const modesTitleId = useId();
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto rounded-card bg-surface px-6 py-[22px]">
      <section aria-labelledby={methodsTitleId} className="flex w-full shrink-0 flex-col">
        <SectionHeading
          id={methodsTitleId}
          title="Medios de cobro aceptados"
          description="Medios que el personal puede registrar al cobrar una cuenta."
        />
        {PAYMENT_METHOD_OPTIONS.map((option) => (
          <SettingRow
            key={option.id}
            size="method"
            label={option.label}
            description={option.description}
            icon={METHOD_ICONS[option.id]}
            checked={draft.methods[option.id]}
            locked={lockedMethods.includes(option.id)}
            onToggle={() => onToggleMethod(option.id)}
          />
        ))}
      </section>

      <section aria-labelledby={modesTitleId} className="mt-[22px] flex w-full shrink-0 flex-col">
        <SectionHeading
          id={modesTitleId}
          title="Modalidades para solicitar la cuenta"
          description="Opciones visibles en la experiencia del cliente."
        />
        {REQUEST_MODE_OPTIONS.map((option) => (
          <SettingRow
            key={option.id}
            size="mode"
            label={option.label}
            description={option.description}
            icon={REQUEST_MODE_ICONS[option.id]}
            checked={draft.requestModes[option.id]}
            onToggle={() => onToggleRequestMode(option.id)}
          />
        ))}
        {transferModeBlocked && (
          <p role="alert" className="mt-3 flex w-full items-center gap-[7px] rounded-nav bg-danger-bg p-[9px] text-danger">
            <CircleAlert size={13} aria-hidden="true" className="shrink-0" />
            <span className="text-[11px] font-bold">{TRANSFER_MODE_RULE}</span>
          </p>
        )}
      </section>
    </div>
  );
}
