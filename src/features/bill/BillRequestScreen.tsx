"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info, Lock, RefreshCw } from "lucide-react";
import { TABLE } from "@/mocks/table";
import { formatPrice } from "@/shared/lib/format-price";
import { delay } from "@/shared/lib/delay";
import { useScreenState } from "@/shared/lib/use-screen-state";
import {
  Notice,
  PrimaryButton,
  ScreenHeader,
  SecondaryButton,
  StickyFooter,
} from "@/shared/ui";
import { getTableSummary, useTableSession, type PaymentPreference } from "@/features/table-session";
import { mutedPrimary, mutedSecondary } from "@/features/table";
import { AcknowledgementCheckbox } from "./AcknowledgementCheckbox";
import { BillHero } from "./BillHero";
import { BillSummaryCard } from "./BillSummaryCard";
import { PaymentOptionCard } from "./PaymentOptionCard";
import {
  BILL_REQUEST_FORCED_STATES,
  canConfirmBillRequest,
  getBillRequestHint,
  getBillRequestView,
} from "./bill-request";
import {
  BILL_REQUEST_ALERTS,
  BILL_REQUEST_INFO,
  BILL_REQUEST_LOCKED,
  ERROR_CONSEQUENCE,
} from "./bill-request-copy";
import { PAYMENT_OPTIONS } from "./payment-options";

const SEND_DELAY_MS = 1200;
const footerButton = "h-[50px]! flex-1 rounded-[25px]! text-[11.5px]!";

/**
 * Screen 08 · Solicitar cuenta. The form sends the request (08B) and opens the status screen;
 * 08C/08F follow the table status and `?state=sending|updated|error|requested|closed` forces a
 * variant. It reads search params, so it must render inside `<Suspense>`.
 */
export function BillRequestScreen() {
  const router = useRouter();
  const forced = useScreenState(BILL_REQUEST_FORCED_STATES);
  const session = useTableSession();
  // 08D and 08E show a selection that is already made ("Conservamos tu selección").
  const prefilled = forced === "updated" || forced === "error";
  const [preference, setPreference] = useState<PaymentPreference | null>(() =>
    prefilled ? (session.paymentPreference ?? "cashier") : null,
  );
  const [acknowledged, setAcknowledged] = useState(prefilled);
  const [sending, setSending] = useState(false);
  const [shownTotal, setShownTotal] = useState<number | null>(null);

  const summary = getTableSummary(session.orders);
  // Remember the total the guest first saw, to warn when it changes before confirming (08D).
  if (session.hydrated && shownTotal === null) setShownTotal(summary.total);
  const totalChanged = shownTotal !== null && shownTotal !== summary.total;

  const header = (
    <ScreenHeader
      title="Solicitar cuenta"
      backHref="/table"
      table={TABLE.number}
      className="mt-2"
      titleClassName="text-[29px]!"
    />
  );

  if (!session.hydrated && !forced) {
    return (
      <>
        {header}
        <main className="flex-1" aria-busy="true" />
      </>
    );
  }

  const view = getBillRequestView({ tableStatus: session.tableStatus, sending, forced, totalChanged });
  const hint = getBillRequestHint({ view, preference, acknowledged });
  const alert = BILL_REQUEST_ALERTS[view];
  const info = BILL_REQUEST_INFO[view];

  async function handleConfirm() {
    if (!canConfirmBillRequest({ view, preference, acknowledged, orderCount: summary.orderCount })) return;
    setSending(true);
    await delay(SEND_DELAY_MS);
    session.setPaymentPreference(preference);
    session.setTableStatus("requested");
    router.push("/table/bill/status");
  }

  const notices = (
    <>
      {alert ? (
        <Notice tone={alert.tone} icon={alert.icon} title={alert.title}>
          {alert.text}
        </Notice>
      ) : null}
      {info ? (
        <Notice tone={info.tone} icon={Info} title={info.title}>
          {info.text}
        </Notice>
      ) : null}
    </>
  );

  if (view === "requested" || view === "closed") {
    const locked = BILL_REQUEST_LOCKED[view];
    return (
      <>
        {header}
        <main className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-6">
          <BillHero
            line={locked.line}
            accent={locked.accent}
            supporting={locked.supporting}
            artOpacity={locked.artOpacity}
          />
          <BillSummaryCard
            table={TABLE.number}
            orderCount={summary.orderCount}
            itemCount={summary.itemCount}
            total={summary.total}
            caption={locked.caption}
          />
          {notices}
          <p className="px-2 text-center text-[10.5px] leading-[14px] text-muted">{locked.consequence}</p>
        </main>
        <StickyFooter className="flex flex-col gap-2">
          <div className="flex gap-2">
            <PrimaryButton size="md" icon={Lock} iconPosition="end" disabled className={`${footerButton} ${mutedPrimary}`}>
              {view === "requested" ? "Cuenta ya solicitada" : "Cuenta cerrada"}
            </PrimaryButton>
            {view === "requested" ? (
              <SecondaryButton size="md" disabled className={`${footerButton} ${mutedSecondary}`}>
                Pedidos pausados
              </SecondaryButton>
            ) : (
              <SecondaryButton size="md" href="/table" className={footerButton}>
                Volver a mi mesa
              </SecondaryButton>
            )}
          </div>
          <p className="text-center text-[9px] text-muted">{hint}</p>
        </StickyFooter>
      </>
    );
  }

  const isSending = view === "sending";
  const canConfirm = canConfirmBillRequest({ view, preference, acknowledged, orderCount: summary.orderCount });
  const confirmLabel =
    view === "sending"
      ? "Enviando solicitud..."
      : view === "updated"
        ? `Confirmar ${formatPrice(summary.total)}`
        : view === "error"
          ? "Reintentar"
          : "Confirmar solicitud";

  return (
    <>
      {header}
      <main className="flex flex-1 flex-col gap-3 px-4 pt-2 pb-6">
        <BillSummaryCard
          table={TABLE.number}
          orderCount={summary.orderCount}
          itemCount={summary.itemCount}
          total={summary.total}
          caption="Importe pendiente de pago"
        />
        {notices}
        {view === "error" ? (
          <p className="px-2 text-center text-[10.5px] leading-[14px] text-muted">{ERROR_CONSEQUENCE}</p>
        ) : null}

        <fieldset className="flex flex-col gap-2" disabled={isSending}>
          <legend className="mb-2 flex flex-col gap-0.5">
            <span className="font-display text-[28px] leading-none font-bold text-ink">¿Cómo querés pagar?</span>
            <span className="text-[11.5px] text-muted">Elegí cómo preferís abonar la cuenta de tu mesa.</span>
          </legend>
          {PAYMENT_OPTIONS.map((option) => (
            <PaymentOptionCard
              key={option.id}
              option={option}
              name="payment-preference"
              checked={preference === option.id}
              disabled={isSending}
              onSelect={() => setPreference(option.id)}
            />
          ))}
        </fieldset>

        <AcknowledgementCheckbox checked={acknowledged} disabled={isSending} onChange={setAcknowledged}>
          Entiendo que esta preferencia no confirma el pago.
        </AcknowledgementCheckbox>

        <div className="flex w-full gap-2.5 rounded-card bg-brand-mist p-3 text-brand">
          <Info size={18} className="mt-px shrink-0" aria-hidden="true" />
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] leading-[14px]">
              Si elegís transferencia, el personal te indicará los datos y verificará la acreditación
              antes de cerrar la cuenta.
            </p>
            <p className="text-[9.5px] font-bold">Solo el personal puede cerrar la mesa.</p>
          </div>
        </div>
      </main>

      <StickyFooter className="flex flex-col gap-2">
        <div className="flex gap-2">
          <PrimaryButton
            size="md"
            icon={view === "error" ? RefreshCw : ArrowRight}
            iconPosition="end"
            onClick={handleConfirm}
            disabled={!canConfirm && !isSending}
            loading={isSending}
            className={isSending ? `${footerButton} ${mutedPrimary}` : footerButton}
          >
            {confirmLabel}
          </PrimaryButton>
          <SecondaryButton
            size="md"
            href={view === "error" ? "/table" : "/menu"}
            disabled={isSending}
            className={isSending ? `${footerButton} ${mutedSecondary}` : footerButton}
          >
            {view === "error" ? "Volver a mi mesa" : "Seguir consumiendo"}
          </SecondaryButton>
        </div>
        <p className="text-center text-[9.5px] text-muted">{hint}</p>
      </StickyFooter>
    </>
  );
}
