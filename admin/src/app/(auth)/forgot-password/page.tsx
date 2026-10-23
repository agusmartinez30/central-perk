import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordScreen } from "@/features/auth";

export const metadata: Metadata = { title: "Recuperar contraseña · Café Central" };

export default function ForgotPasswordPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <ForgotPasswordScreen />
    </Suspense>
  );
}
