import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Pedidos · Café Central" };

export default function OrdersPage() {
  return <ComingSoon moduleId="orders" />;
}
