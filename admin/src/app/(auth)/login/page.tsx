import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginScreen } from "@/features/auth";

export const metadata: Metadata = { title: "Iniciar sesión · Café Central" };

export default function LoginPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
