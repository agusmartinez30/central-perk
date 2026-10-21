"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, QrCode } from "lucide-react";
import { TABLE } from "@/mocks/table";
import { delay } from "@/shared/lib/delay";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { PrimaryButton, SecondaryButton, StateCard, type ButtonProps } from "@/shared/ui";
import { getTableSummary, useTableSession } from "@/features/table-session";
import { mutedPrimary } from "@/features/table";
import { AccountStatusCard } from "./AccountStatusCard";
import { BillStatusHero } from "./BillStatusHero";
import {
  BILL_STATUS_FORCED_STATES,
  getBillStatusView,
  getPaymentStatusLabel,
} from "./bill-status";
import {
  BILL_STATUS_COPY,
  REQUESTED_SUPPORTING,
  TABLE_STATE_FOR_STATUS,
  type BillStatusAction,
} from "./bill-status-copy";

const RETRY_DELAY_MS = 900;

/**
 * Screen 09 · Cuenta solicitada and its 09A–E variants. The variant follows the table status;
 * `?state=requested|attending|closed|reopened|offline|invalid` forces one. An open table that
 * never asked for the bill is sent back to 08. It reads search params, so it must render
 * inside `<Suspense>`.
 */
export function BillStatusScreen() {
  const router = useRouter();
  const forced = useScreenState(BILL_STATUS_FORCED_STATES);
  const { orders, tableStatus, paymentPreference, hydrated, reset } = useTableSession();
  const [retrying, setRetrying] = useState(false);

  const view = getBillStatusView(tableStatus, forced);
  const notRequested = hydrated && view === "not-requested";

  useEffect(() => {
    if (notRequested) router.replace("/table/bill");
  }, [notRequested, router]);

  if ((!hydrated && !forced) || view === "not-requested") return null;

  const copy = BILL_STATUS_COPY[view];
  const summary = getTableSummary(orders);
  const tableState = forced ? TABLE_STATE_FOR_STATUS[forced] : undefined;
  const tableHref = tableState ? `/table?state=${tableState}` : "/table";

  async function handleRetry() {
    // Simulates a re-check, then shows the live status without the forced variant.
    setRetrying(true);
    await delay(RETRY_DELAY_MS);
    router.replace("/table/bill/status");
    setRetrying(false);
  }

  function handleFinish() {
    // Ending the real session clears it; a forced preview only leaves the screen.
    if (tableStatus === "closed") reset();
    router.push("/");
  }

  function actionProps(action: BillStatusAction): Partial<ButtonProps> {
    switch (action.kind) {
      case "link":
        return { href: action.href };
      case "table":
        return { href: tableHref };
      case "retry":
        return { onClick: handleRetry, loading: retrying };
      case "finish":
        return { onClick: handleFinish };
      case "disabled":
        return { disabled: true, className: action.muted ? mutedPrimary : undefined };
    }
  }

  const supporting =
    view === "requested" ? REQUESTED_SUPPORTING[paymentPreference ?? "cashier"] : copy.supporting;
  const paymentLabel = copy.paymentLabel ?? getPaymentStatusLabel(paymentPreference);
  const primary = actionProps(copy.primary.action);

  return (
    <>
      <BillStatusHero
        cafeName={TABLE.cafeName}
        table={TABLE.number}
        title={copy.title}
        titleSize={copy.titleSize}
        supporting={supporting}
        artOpacity={copy.artOpacity}
      />
      <main className="flex flex-1 flex-col gap-3 px-4 pt-4 pb-6">
        {view === "invalid" ? (
          <StateCard variant="empty" icon={QrCode} title="Sesión no disponible" className="mt-3 min-h-[276px]">
            Este código ya no corresponde a una mesa activa. No podemos mostrar ni modificar la cuenta.
          </StateCard>
        ) : (
          <>
            <AccountStatusCard
              statusLabel={copy.statusLabel}
              statusIcon={copy.statusIcon}
              table={TABLE.number}
              orderCount={summary.orderCount}
              total={summary.total}
              paymentLabel={paymentLabel}
              paymentIcon={copy.paymentIcon}
            />
            <div className="flex min-h-[82px] w-full items-center gap-[11px] rounded-card bg-brand-tint p-3 text-brand">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface">
                <Info size={17} aria-hidden="true" />
              </span>
              <p className="text-[10.5px] leading-[14px]">{copy.notice}</p>
            </div>
          </>
        )}
        <div className="mt-1 flex flex-col gap-3">
          <PrimaryButton
            icon={copy.primary.icon}
            iconPosition="end"
            {...primary}
            className={`text-[15px]! ${primary.className ?? ""}`}
          >
            {copy.primary.label}
          </PrimaryButton>
          <SecondaryButton
            icon={copy.secondary.icon}
            {...actionProps(copy.secondary.action)}
            className="h-[52px]! rounded-[26px]! text-[14.5px]!"
          >
            {copy.secondary.label}
          </SecondaryButton>
        </div>
        <p className="mt-auto px-4 pt-1 text-center text-[9px] text-muted">{copy.note}</p>
      </main>
    </>
  );
}
