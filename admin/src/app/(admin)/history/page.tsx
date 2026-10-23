import { Suspense } from "react";
import type { Metadata } from "next";
import { CollectionsScreen } from "@/features/collections";

export const metadata: Metadata = { title: "Historial de cobros · Café Central" };

export default function HistoryPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <CollectionsScreen />
    </Suspense>
  );
}
