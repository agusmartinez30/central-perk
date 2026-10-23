import { CircleAlert, Info } from "lucide-react";
import type { RequestModeOption } from "./payment-settings";
import { REQUEST_MODE_ICONS } from "./PaymentSettingsForm";

/**
 * "Settings Preview Column": the "Live Customer Payment Preview" of the customer's 08 screen with
 * the request modes enabled in the draft, plus the "Transfer Guidance" note.
 */
export function SettingsPreviewColumn({ modes }: { modes: RequestModeOption[] }) {
  return (
    <aside aria-label="Vista del cliente" className="flex h-full w-[360px] shrink-0 flex-col gap-2.5">
      <section className="flex w-full flex-1 flex-col gap-3 rounded-auth bg-surface p-[18px] outline-1 -outline-offset-[0.5px] outline-line">
        <header className="flex w-full items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-bold whitespace-nowrap text-brand">Vista del cliente</p>
            <p className="text-[11px] font-semibold whitespace-nowrap text-muted">Pantalla 08 · Solicitar cuenta</p>
          </div>
          <span className="flex h-[26px] items-center rounded-[7px] bg-success-bg px-2 text-[11px] font-bold text-success">
            En vivo
          </span>
        </header>
        <div className="flex w-full flex-1 flex-col gap-3 rounded-[18px] bg-cream px-[18px] pt-7 pb-[18px] outline-[5px] -outline-offset-[2.5px] outline-ink">
          <p className="text-[11px] font-bold text-ink">CAFÉ CENTRAL</p>
          <p className="text-[21px] font-bold whitespace-nowrap text-ink">¿Cómo preferís pagar?</p>
          <p className="text-[12px] text-muted">Elegí una opción para avisarle al personal.</p>
          {modes.length > 0 ? (
            <ul className="flex w-full flex-col gap-3">
              {modes.map((mode) => {
                const Icon = REQUEST_MODE_ICONS[mode.id];
                return (
                  <li
                    key={mode.id}
                    className="flex w-full items-center gap-2.5 rounded-[10px] bg-surface p-3 outline-1 -outline-offset-[0.5px] outline-line"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-brand-wash text-brand"
                    >
                      <Icon size={15} />
                    </span>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="text-[12px] font-bold whitespace-nowrap text-ink">{mode.label}</p>
                      <p className="text-[11px] whitespace-nowrap text-muted">{mode.customerDescription}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[12px] font-semibold text-muted">Sin modalidades habilitadas.</p>
          )}
          <p className="flex w-full items-start gap-[7px] rounded-nav bg-brand-wash p-[9px] text-brand">
            <Info size={13} aria-hidden="true" className="shrink-0" />
            <span className="text-[11px] font-bold">Tu preferencia no confirma el pago.</span>
          </p>
        </div>
      </section>
      <div className="flex w-full shrink-0 items-center gap-2 rounded-[9px] bg-warning-bg p-2.5">
        <CircleAlert size={14} aria-hidden="true" className="shrink-0 text-warning" />
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-[12px] font-bold whitespace-nowrap text-warning">Verificación bancaria</p>
          <p className="text-[11px] text-muted">Un comprobante no confirma el pago: verificá la acreditación.</p>
        </div>
      </div>
    </aside>
  );
}
