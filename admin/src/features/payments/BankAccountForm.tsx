import { useId } from "react";
import clsx from "clsx";
import { Copy, Link2, ShieldAlert } from "lucide-react";
import type { BankAccount } from "@/mocks/types";
import { BANK_FIELDS, TRANSFER_MODE_RULE, type BankAccountErrors, type BankField } from "./payment-settings";

/** Input hints per field; the CBU / CVU is numeric. */
const FIELD_INPUT: Partial<Record<BankField, { inputMode: "numeric"; autoComplete: "off" }>> = {
  cbu: { inputMode: "numeric", autoComplete: "off" },
};

type BankFieldInputProps = {
  field: BankField;
  label: string;
  value: string;
  error?: string;
  /** The CBU / CVU input carries a copy button, as in the export. */
  copyable?: boolean;
  onChange: (value: string) => void;
};

/** "Campo · …": label, 44px input and its inline error (error copy is not in the exports). */
function BankFieldInput({ field, label, value, error, copyable, onChange }: BankFieldInputProps) {
  const inputId = useId();
  const errorId = useId();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[11px] font-bold whitespace-nowrap text-muted">
        {label}
      </label>
      <div className="relative w-full">
        <input
          id={inputId}
          name={field}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...FIELD_INPUT[field]}
          className={clsx(
            "h-11 w-full rounded-nav bg-surface px-3 text-[12px] font-semibold text-ink outline-1 -outline-offset-[0.5px] focus:outline-2 focus:-outline-offset-1",
            copyable && "pr-10",
            error ? "outline-danger" : "outline-line focus:outline-brand",
          )}
        />
        {copyable && (
          <button
            type="button"
            aria-label={`Copiar ${label}`}
            title={`Copiar ${label}`}
            onClick={() => void navigator.clipboard?.writeText(value.trim()).catch(() => undefined)}
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-chip text-muted hover:bg-cream hover:text-ink"
          >
            <Copy size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-[11px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type BankAccountFormProps = {
  account: BankAccount;
  errors: BankAccountErrors;
  /** "Por transferencia" is on while the Transferencia method is off. */
  transferModeBlocked: boolean;
  onFieldChange: (field: BankField, value: string) => void;
};

/**
 * "Configuración bancaria" of the "Datos bancarios" tab: the form with the "ACCESO RESTRINGIDO"
 * pill, the "Dependencia de transferencia" note and the "Aviso de seguridad" audit note.
 */
export function BankAccountForm({ account, errors, transferModeBlocked, onFieldChange }: BankAccountFormProps) {
  const titleId = useId();
  const field = (id: BankField) => (
    <BankFieldInput
      field={id}
      label={BANK_FIELDS.find((option) => option.id === id)?.label ?? id}
      value={account[id]}
      error={errors[id]}
      copyable={id === "cbu"}
      onChange={(value) => onFieldChange(id, value)}
    />
  );

  return (
    <section
      aria-labelledby={titleId}
      className="flex h-full min-w-0 flex-1 flex-col gap-[18px] overflow-y-auto rounded-card bg-surface px-6 py-[22px]"
    >
      <div className="flex w-full shrink-0 items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="text-[14px] font-extrabold whitespace-nowrap text-ink">
            Datos bancarios
          </h3>
          <p className="text-[11px] font-medium text-muted">
            Información ficticia de ejemplo · visible solo para personal autorizado.
          </p>
        </div>
        <span className="shrink-0 rounded-[12px] bg-cream px-2 py-1 text-[11px] font-extrabold whitespace-nowrap text-muted">
          ACCESO RESTRINGIDO
        </span>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-4">
        <div className="flex w-full items-start gap-3.5">
          {field("holder")}
          {field("bank")}
        </div>
        <div className="flex w-full items-start gap-3.5">
          {field("alias")}
          {field("cbu")}
        </div>
        <div className="flex w-full">{field("staffInstructions")}</div>
      </div>
      <p
        role={transferModeBlocked ? "alert" : undefined}
        className={clsx(
          "flex w-full shrink-0 items-center gap-2 rounded-nav p-[11px]",
          transferModeBlocked ? "bg-danger-bg text-danger" : "bg-brand-wash text-brand",
        )}
      >
        <Link2 size={15} aria-hidden="true" className="shrink-0" />
        <span className="flex-1 text-[11px] font-bold">{TRANSFER_MODE_RULE}</span>
      </p>
      <p className="flex w-full shrink-0 items-center gap-2 rounded-nav bg-warning-bg p-[11px] text-warning">
        <ShieldAlert size={15} aria-hidden="true" className="shrink-0" />
        <span className="flex-1 text-[11px] font-bold">Los cambios quedan registrados en el historial de auditoría.</span>
      </p>
    </section>
  );
}
