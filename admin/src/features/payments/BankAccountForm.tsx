import { useId } from "react";
import clsx from "clsx";
import { Link2 } from "lucide-react";
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
  onChange: (value: string) => void;
};

/** "Bank Field · …": label, 38px input and its inline error (error copy is not in the exports). */
function BankFieldInput({ field, label, value, error, onChange }: BankFieldInputProps) {
  const inputId = useId();
  const errorId = useId();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
      <label htmlFor={inputId} className="text-[11px] font-bold whitespace-nowrap text-muted">
        {label}
      </label>
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
          "h-[38px] w-full rounded-nav bg-surface px-2.5 text-[12px] font-semibold text-ink outline-1 -outline-offset-[0.5px] focus:outline-2 focus:-outline-offset-1",
          error ? "outline-danger" : "outline-line focus:outline-brand",
        )}
      />
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

/** "Editable Bank Account Form" and the "Bank Transfer Dependency" note of the "Datos bancarios" tab. */
export function BankAccountForm({ account, errors, transferModeBlocked, onFieldChange }: BankAccountFormProps) {
  const titleId = useId();
  const field = (id: BankField) => {
    return (
      <BankFieldInput
        field={id}
        label={BANK_FIELDS.find((option) => option.id === id)?.label ?? id}
        value={account[id]}
        error={errors[id]}
        onChange={(value) => onFieldChange(id, value)}
      />
    );
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
      <section
        aria-labelledby={titleId}
        className="flex w-full shrink-0 flex-col gap-3 rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line"
      >
        <div className="flex flex-col gap-[3px]">
          <h3 id={titleId} className="text-[14px] font-bold whitespace-nowrap text-ink">
            Datos bancarios
          </h3>
          <p className="text-[11px] text-muted">
            Información ficticia de ejemplo · visible solo para personal autorizado.
          </p>
        </div>
        <div className="flex w-full items-start gap-2.5">
          {field("holder")}
          {field("bank")}
        </div>
        <div className="flex w-full items-start gap-2.5">
          {field("alias")}
          {field("cbu")}
        </div>
        <div className="flex w-full">{field("staffInstructions")}</div>
      </section>
      <p
        role={transferModeBlocked ? "alert" : undefined}
        className={clsx(
          "flex w-full shrink-0 items-center gap-2 rounded-[9px] p-[11px]",
          transferModeBlocked ? "bg-danger-bg text-danger" : "bg-brand-wash text-brand",
        )}
      >
        <Link2 size={15} aria-hidden="true" className="shrink-0" />
        <span className="flex-1 text-[11px] font-bold">{TRANSFER_MODE_RULE}</span>
      </p>
    </div>
  );
}
