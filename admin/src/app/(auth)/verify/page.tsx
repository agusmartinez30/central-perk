import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyScreen } from "@/features/auth";

export const metadata: Metadata = { title: "Verificación en dos pasos · Café Central" };

export default function VerifyPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <VerifyScreen />
    </Suspense>
  );
}
