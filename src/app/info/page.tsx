import { Suspense } from "react";
import type { Metadata } from "next";
import { CafeInfoScreen } from "@/features/cafe-info";

export const metadata: Metadata = { title: "Detalle del negocio · Café Central" };

export default function InfoPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <CafeInfoScreen />
    </Suspense>
  );
}
