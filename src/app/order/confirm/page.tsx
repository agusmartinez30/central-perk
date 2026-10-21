import type { Metadata } from "next";
import { ConfirmOrderScreen } from "@/features/order";

export const metadata: Metadata = { title: "Confirmar pedido · Café Central" };

export default function ConfirmOrderPage() {
  return <ConfirmOrderScreen />;
}
