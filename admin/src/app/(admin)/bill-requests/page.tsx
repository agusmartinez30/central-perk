import { Suspense } from "react";
import type { Metadata } from "next";
import { BillRequestsScreen } from "@/features/bill-requests";

export const metadata: Metadata = { title: "Solicitudes de cuenta · Café Central" };

export default function BillRequestsPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <BillRequestsScreen />
    </Suspense>
  );
}
