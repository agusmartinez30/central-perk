import { useId } from "react";
import clsx from "clsx";
import {
  Banknote,
  CircleAlert,
  CircleEllipsis,
  ConciergeBell,
  CreditCard,
  Info,
  Landmark,
  Split,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { AcceptedPaymentMethod, BillPaymentMethod, PaymentSettings } from "@/mocks/types";
import {
  MINIMUM_METHOD_RULE,
  PAYMENT_METHOD_OPTIONS,
  REQUEST_MODE_OPTIONS,
  TRANSFER_MODE_RULE,
} from "./payment-settings";

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

type SettingToggleProps = {
  label: string;
  description: string;
  icon: LucideIcon;
  checked: boolean;
  /** Locked switches stay on (the last enabled method). */
  locked?: boolean;
  /** `method` cards are 68px tall with a 38px brand icon; `mode` cards 64px with a 36px cream icon. */
  variant: "method" | "mode";
  onToggle: () => void;
};

/** "Método · …" / "Modalidad · …" card: icon, copy and a 38×22 switch. */
function SettingToggle({ label, description, icon: Icon, checked, locked, variant, onToggle }: SettingToggleProps) {
  const labelId = useId();
  const descriptionId = useId();
  const isMethod = variant === "method";
  return (
    <div
      className={clsx(
        "flex flex-1 items-center rounded-[10px] bg-surface p-3 outline-1 -outline-offset-[0.5px] outline-line",
        isMethod ? "min-h-[68px] gap-3" : "min-h-16 gap-[11px]",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-[9px] text-brand",
          isMethod ? "size-[38px] bg-brand-wash" : "size-9 bg-cream",
        )}
      >
        <Icon size={isMethod ? 17 : 16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <p id={labelId} className="text-[13px] font-bold whitespace-nowrap text-ink">
          {label}
        </p>
        <p id={descriptionId} className="text-[11px] text-muted">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={locked}
        onClick={onToggle}
        className={clsx(
          "flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] p-[3px] disabled:cursor-not-allowed",
          checked ? "justify-end bg-brand" : "justify-start bg-sand",
        )}
      >
        <span aria-hidden="true" className="size-4 rounded-full bg-surface" />
      </button>
    </div>
  );
}

function PanelHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <h3 id={id} className="text-[14px] font-bold whitespace-nowrap text-ink">
        {title}
      </h3>
      <p className="text-[11px] text-muted">{description}</p>
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

/** "Payment Settings Form": "Accepted Payment Methods" and "Customer Payment Preferences". */
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
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
      <section
        aria-labelledby={methodsTitleId}
        className="flex w-full shrink-0 flex-col gap-2.5 rounded-card bg-surface p-3.5 outline-1 -outline-offset-[0.5px] outline-line"
      >
        <PanelHeading
          id={methodsTitleId}
          title="Medios de cobro aceptados"
          description="Seleccioná los medios que el personal puede registrar al cobrar una cuenta."
        />
        <div className="grid w-full grid-cols-2 gap-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <SettingToggle
              key={option.id}
              variant="method"
              label={option.label}
              description={option.description}
              icon={METHOD_ICONS[option.id]}
              checked={draft.methods[option.id]}
              locked={lockedMethods.includes(option.id)}
              onToggle={() => onToggleMethod(option.id)}
            />
          ))}
        </div>
        <p className="flex w-full items-center gap-[7px] rounded-nav bg-cream p-[9px]">
          <Info size={13} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="text-[11px] font-semibold text-muted">{MINIMUM_METHOD_RULE}</span>
        </p>
      </section>

      <section
        aria-labelledby={modesTitleId}
        className="flex w-full shrink-0 flex-col gap-[9px] rounded-card bg-surface p-3.5 outline-1 -outline-offset-[0.5px] outline-line"
      >
        <PanelHeading
          id={modesTitleId}
          title="Modalidades para solicitar la cuenta"
          description="Estas opciones aparecerán en la pantalla del cliente. No se selecciona una modalidad predeterminada."
        />
        <div className="grid w-full grid-cols-3 gap-2">
          {REQUEST_MODE_OPTIONS.map((option) => (
            <SettingToggle
              key={option.id}
              variant="mode"
              label={option.label}
              description={option.description}
              icon={REQUEST_MODE_ICONS[option.id]}
              checked={draft.requestModes[option.id]}
              onToggle={() => onToggleRequestMode(option.id)}
            />
          ))}
        </div>
        {transferModeBlocked && (
          <p role="alert" className="flex w-full items-center gap-[7px] rounded-nav bg-danger-bg p-[9px] text-danger">
            <CircleAlert size={13} aria-hidden="true" className="shrink-0" />
            <span className="text-[11px] font-bold">{TRANSFER_MODE_RULE}</span>
          </p>
        )}
        <p className="flex w-full items-center gap-[7px] rounded-nav bg-brand-wash p-[9px] text-brand">
          <Split size={13} aria-hidden="true" className="shrink-0" />
          <span className="text-[11px] font-bold">
            La modalidad elegida por el cliente no confirma ni determina el medio de pago real.
          </span>
        </p>
      </section>
    </div>
  );
}
