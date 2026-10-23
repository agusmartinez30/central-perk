"use client";

import { useState } from "react";
import { OVERVIEW_SNAPSHOT } from "@/mocks/overview";
import type { OverviewPeriod } from "@/mocks/types";
import { delay } from "@/shared/lib/delay";
import { AttentionOrdersPanel, BillRequestsPanel } from "./AttentionPanels";
import { DashboardHeader } from "./DashboardHeader";
import { KpiCard } from "./KpiCard";
import { BestSellers, QuickActions } from "./ProductsAndActions";
import { SalesOverview } from "./SalesOverview";
import { TablesOverview } from "./TablesOverview";
import {
  getBestSellerBars,
  getFinancialSummary,
  getOverviewKpis,
  groupSalesByHour,
} from "./overview-view";

function formatSyncTime(date: Date): string {
  return date.toLocaleTimeString("es-AR", { hour12: false });
}

/**
 * 10A · Resumen general. The period filter is visual only in this prototype: the mock holds a
 * single "today" snapshot.
 */
export function OverviewScreen() {
  const snapshot = OVERVIEW_SNAPSHOT;
  const [period, setPeriod] = useState<OverviewPeriod>("today");
  const [lastSync, setLastSync] = useState(snapshot.lastSync);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await delay(700);
    setLastSync(formatSyncTime(new Date()));
    setRefreshing(false);
  };

  return (
    <div className="flex flex-1 flex-col gap-2 px-6 py-3.5">
      <DashboardHeader
        period={period}
        onPeriodChange={setPeriod}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <div className="flex h-[34px] items-center justify-between gap-4 rounded-nav bg-brand-wash px-3">
        <p className="text-[11px] font-semibold text-brand">
          El período afecta métricas comerciales. Los paneles operativos siempre muestran la
          actividad actual.
        </p>
        <p className="text-[11px] whitespace-nowrap text-muted" aria-live="polite">
          Última sincronización: {lastSync}
        </p>
      </div>
      <div className="flex gap-2">
        {getOverviewKpis(snapshot).map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
      <div className="flex h-[270px] shrink-0 gap-2.5">
        <AttentionOrdersPanel orders={snapshot.orders} />
        <BillRequestsPanel requests={snapshot.billRequests} />
      </div>
      <div className="flex min-h-[300px] flex-1 gap-2.5">
        <TablesOverview tables={snapshot.tables} />
        <SalesOverview
          bars={groupSalesByHour(snapshot.payments)}
          summary={getFinancialSummary(snapshot.payments, snapshot.confirmedOrders)}
        />
        <div className="flex h-full flex-1 flex-col gap-2">
          <BestSellers products={getBestSellerBars(snapshot.bestSellers)} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
