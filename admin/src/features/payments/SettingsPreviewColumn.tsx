import type { ReactNode } from "react";
import clsx from "clsx";
import { ArrowLeft, CircleAlert, Copy, Info, Landmark, Lock, Split } from "lucide-react";
import type { BankAccount } from "@/mocks/types";
import type { RequestModeOption } from "./payment-settings";
import type { SettingsTab } from "./payments-state";
import { REQUEST_MODE_ICONS } from "./PaymentSettingsForm";

/** "Viewport móvil refinado": the customer phone with its top bar; read-only, nothing is focusable. */
function PhoneViewport({ children, footer, className }: { children: ReactNode; footer?: ReactNode; className?: string }) {
  return (
    <div className={clsx(className, "flex min-h-0 w-[300px] flex-1 flex-col items-center overflow-hidden rounded-[22px] bg-[#fbfaf7] shadow-[0px_5px_16px_#10101014] outline-1 -outline-offset-[0.5px] outline-[#cfcbc3]")}>
      <span aria-hidden="true" className="h-1 w-16 shrink-0 rounded-[2px] bg-[#d4d0c8]" />
      <div className="flex h-10 w-full shrink-0 items-center justify-between bg-surface px-3.5 text-ink">
        <ArrowLeft size={14} aria-hidden="true" />
        <p className="text-[11px] font-bold tracking-[0.7px] whitespace-nowrap">CAFÉ CENTRAL</p>
        <Info size={13} aria-hidden="true" className="text-muted" />
      </div>
      {children}
      {footer}
    </div>
  );
}

/** "Previsualización en tiempo real": the customer's "¿Cómo preferís pagar?" with the draft's modes. */
function RequestModesPreview({ modes }: { modes: RequestModeOption[] }) {
  return (
    <PhoneViewport
      footer={
        <div className="flex h-[58px] w-full shrink-0 border-t border-line bg-surface px-3 py-[9px]">
          <span className="flex flex-1 items-center justify-center rounded-nav bg-line text-[11px] font-bold whitespace-nowrap text-[#77736c]">
            Elegí una opción para continuar
          </span>
        </div>
      }
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden px-4 pt-[18px] pb-3">
        <div className="flex w-full shrink-0 flex-col gap-[5px]">
          <p className="text-[21px] font-bold whitespace-nowrap text-ink">¿Cómo preferís pagar?</p>
          <p className="text-[12px] text-muted">Elegí una opción para solicitar tu cuenta.</p>
        </div>
        {modes.length > 0 ? (
          <ul className="flex w-full shrink-0 flex-col gap-2">
            {modes.map((mode) => {
              const Icon = REQUEST_MODE_ICONS[mode.id];
              return (
                <li
                  key={mode.id}
                  className="flex h-[68px] w-full items-center gap-2.5 rounded-[10px] bg-surface px-[11px] outline-1 -outline-offset-[0.5px] outline-line"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-wash text-brand"
                  >
                    <Icon size={15} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-[12px] font-bold whitespace-nowrap text-ink">{mode.customerLabel}</p>
                    <p className="text-[11px] whitespace-nowrap text-muted">{mode.customerDescription}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="size-4 shrink-0 rounded-full bg-surface outline-1 -outline-offset-[0.5px] outline-line"
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[12px] font-semibold text-muted">Sin modalidades habilitadas.</p>
        )}
        <p className="flex w-full shrink-0 items-center gap-[7px] rounded-nav bg-[#f3f5fa] p-[9px] text-muted">
          <Info size={12} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="text-[11px]">La preferencia no confirma el medio de pago.</span>
        </p>
      </div>
    </PhoneViewport>
  );
}

/** "Opción por transferencia": the customer's transfer instructions with the draft's bank data. */
function TransferPreview({ account }: { account: BankAccount }) {
  const rows = [
    { label: "BANCO", value: account.bank },
    { label: "ALIAS", value: account.alias },
    { label: "TITULAR", value: account.holder },
  ];
  return (
    // The transfer phone is 490px tall in the export, shorter than its card.
    <PhoneViewport className="max-h-[490px]">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-[11px] overflow-hidden px-4 pt-4 pb-3.5">
        <div className="flex w-full shrink-0 flex-col items-start gap-[5px]">
          <span className="flex h-[22px] items-center gap-[5px] rounded-[11px] bg-brand-wash px-2 text-brand">
            <Landmark size={11} aria-hidden="true" />
            <span className="text-[11px] font-bold tracking-[0.4px] whitespace-nowrap">TRANSFERENCIA BANCARIA</span>
          </span>
          <p className="text-[20px] font-bold whitespace-nowrap text-ink">Pago por transferencia</p>
          <p className="text-[12px] text-muted">Usá estos datos para realizar el pago.</p>
        </div>
        <dl className="flex w-full shrink-0 flex-col overflow-hidden rounded-[10px] bg-surface outline-1 -outline-offset-[0.5px] outline-line">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex h-[42px] w-full items-center justify-between gap-3 border-b border-[#e9e6df] px-[11px] last:border-b-0"
            >
              <dt className="shrink-0 text-[11px] font-bold tracking-[0.5px] text-muted">{row.label}</dt>
              <dd className="min-w-0 truncate text-[12px] font-bold text-ink">{row.value.trim() || "—"}</dd>
            </div>
          ))}
        </dl>
        <span className="flex h-[38px] w-full shrink-0 items-center justify-center gap-[7px] rounded-nav bg-brand text-white">
          <Copy size={13} aria-hidden="true" />
          <span className="text-[12px] font-bold whitespace-nowrap">Copiar alias</span>
        </span>
        <p className="flex w-full shrink-0 items-start gap-[7px] rounded-nav bg-warning-bg p-[9px] text-warning">
          <CircleAlert size={12} aria-hidden="true" className="mt-px shrink-0" />
          <span className="flex-1 text-[11px]/[14px] font-semibold">
            El personal confirmará el pago después de verificar la acreditación.
          </span>
        </p>
      </div>
    </PhoneViewport>
  );
}

type SettingsPreviewColumnProps = {
  tab: SettingsTab;
  /** Request modes enabled in the draft. */
  modes: RequestModeOption[];
  /** Bank data of the draft. */
  account: BankAccount;
};

/**
 * "Columna preview": the read-only "VISTA DEL CLIENTE" of the active tab. "Métodos y modalidades"
 * shows the request modes ("Previsualización en tiempo real") and the "Nota separación" below;
 * "Datos bancarios" shows the transfer instructions ("Opción por transferencia").
 */
export function SettingsPreviewColumn({ tab, modes, account }: SettingsPreviewColumnProps) {
  const methods = tab === "methods";
  return (
    <aside aria-label="Vista del cliente" className="flex h-full w-[352px] shrink-0 flex-col gap-2.5">
      <section className="flex min-h-0 w-full flex-1 flex-col gap-3 rounded-card bg-surface p-3.5 outline-1 -outline-offset-[0.5px] outline-line">
        <header className="flex w-full shrink-0 items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-extrabold whitespace-nowrap text-brand">VISTA DEL CLIENTE</p>
            <p className="text-[12px] font-bold whitespace-nowrap text-ink">
              {methods ? "Previsualización en tiempo real" : "Opción por transferencia"}
            </p>
          </div>
          <span className="flex h-[26px] items-center gap-[5px] rounded-[13px] bg-sand px-2 text-muted">
            <Lock size={11} aria-hidden="true" />
            <span className="text-[11px] font-bold whitespace-nowrap">SOLO LECTURA</span>
          </span>
        </header>
        {methods ? <RequestModesPreview modes={modes} /> : <TransferPreview account={account} />}
      </section>
      {methods && (
        <p className="flex w-full shrink-0 items-center gap-[7px] rounded-nav bg-brand-wash p-2.5 text-brand">
          <Split size={13} aria-hidden="true" className="shrink-0" />
          <span className="text-[11px] font-bold">La modalidad elegida no determina el medio de pago real.</span>
        </p>
      )}
    </aside>
  );
}
