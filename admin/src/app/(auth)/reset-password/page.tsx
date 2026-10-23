import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordScreen } from "@/features/auth";

export const metadata: Metadata = { title: "Nueva contraseña · Café Central" };

export default function ResetPasswordPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
