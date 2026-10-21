import { Suspense } from "react";
import type { Metadata } from "next";
import { BillStatusScreen } from "@/features/bill";
import { StatusBar } from "@/shared/ui";

export const metadata: Metadata = { title: "Estado de tu cuenta · Café Central" };

export default function BillStatusPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={<StatusBar />}>
      <BillStatusScreen />
    </Suspense>
  );
}
