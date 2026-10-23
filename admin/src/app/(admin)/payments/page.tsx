import type { Metadata } from "next";
import { PaymentSettingsScreen } from "@/features/payments";

export const metadata: Metadata = { title: "Configuración de pagos · Café Central" };

export default function PaymentsPage() {
  return <PaymentSettingsScreen />;
}
