import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentSettingsScreen } from "@/features/payments";

export const metadata: Metadata = { title: "Configuración de pagos · Café Central" };

export default function PaymentSettingsPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <PaymentSettingsScreen />
    </Suspense>
  );
}
