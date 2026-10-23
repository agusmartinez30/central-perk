import type { Metadata } from "next";
import { OrderScreen } from "@/features/order";

export const metadata: Metadata = { title: "Mi pedido · Café Central" };

export default function OrderPage() {
  return <OrderScreen />;
}
