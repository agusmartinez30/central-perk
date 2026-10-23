import { Suspense } from "react";
import type { Metadata } from "next";
import { BillRequestScreen } from "@/features/bill";

export const metadata: Metadata = { title: "Solicitar cuenta · Café Central" };

export default function BillRequestPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <BillRequestScreen />
    </Suspense>
  );
}
