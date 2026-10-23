import { Suspense } from "react";
import type { Metadata } from "next";
import { OrdersScreen } from "@/features/orders";

export const metadata: Metadata = { title: "Pedidos · Café Central" };

export default function OrdersPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <OrdersScreen />
    </Suspense>
  );
}
