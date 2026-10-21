import { Suspense } from "react";
import type { Metadata } from "next";
import { SEED_ORDERS } from "@/mocks/table";
import { OrderStatusScreen } from "@/features/order";

/**
 * Seed orders are prerendered; orders placed in the browser live in localStorage, so other
 * ids render on demand and the client resolves them (or shows the not-found fallback).
 */
export function generateStaticParams() {
  return SEED_ORDERS.map((order) => ({ orderId: order.id }));
}

export const metadata: Metadata = { title: "Tu pedido · Café Central" };

export default async function OrderStatusPage({ params }: PageProps<"/order/[orderId]">) {
  const { orderId } = await params;
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <OrderStatusScreen orderId={decodeURIComponent(orderId)} />
    </Suspense>
  );
}
