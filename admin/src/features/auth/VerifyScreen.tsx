"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Info } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { Notice, PrimaryButton, TextButton } from "@/shared/ui";
import { verifyMfa } from "./auth-api";
import { REQUEST_ERROR_COPY, toVerifyError } from "./auth-errors";
import { AuthCard } from "./AuthCard";
import { CodeInput } from "./CodeInput";
import { sessionStore } from "./session-store";
import { isValidMfaCode } from "./validation";

/** `?state=error` shows the wrong-code message without submitting. */
export const VERIFY_FORCED_STATES = ["error"] as const;

type VerifyError = "incomplete" | "wrong-code" | keyof typeof REQUEST_ERROR_COPY;

const ERROR_COPY: Record<VerifyError, string> = {
  incomplete: "Ingresá los 6 dígitos del código.",
  "wrong-code": "El código no es correcto. Probá con el código actual de tu aplicación.",
  ...REQUEST_ERROR_COPY,
};

/** 11D · Multi-Factor Verification, against `POST /auth/mfa/verify`. */
export function VerifyScreen() {
  const router = useRouter();
  const forcedState = useScreenState(VERIFY_FORCED_STATES);
  const [code, setCode] = useState("");
  const [error, setError] = useState<VerifyError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shownError = error ?? (forcedState === "error" ? "wrong-code" : null);

  const handleChange = (value: string) => {
    setCode(value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isValidMfaCode(code)) {
      setError("incomplete");
      return;
    }
    setSubmitting(true);
    const result = await verifyMfa(code);
    if (!result.ok) {
      const requestError = toVerifyError(result.error);
      // No pending login (expired, or /verify opened directly): start over.
      if (requestError === "session-expired") {
        router.replace("/login");
        return;
      }
      setSubmitting(false);
      setError(requestError);
      return;
    }
    if (result.value.status === "authenticated") sessionStore.signIn(result.value.staff);
    router.push("/");
  };

  return (
    <AuthCard
      eyebrow="VERIFICACIÓN EN DOS PASOS"
      title="Verificá tu identidad"
      description="Ingresá el código de tu aplicación autenticadora."
      onSubmit={handleSubmit}
    >
      <CodeInput
        id="mfa-code"
        label="Código de verificación de 6 dígitos"
        value={code}
        onChange={handleChange}
        invalid={shownError !== null}
      />
      {shownError ? (
        <Notice tone="danger" icon={CircleAlert}>
          {ERROR_COPY[shownError]}
        </Notice>
      ) : (
        <Notice tone="info" icon={Info}>
          Ejemplo ficticio: 123 — — —
        </Notice>
      )}
      <PrimaryButton type="submit" loading={submitting}>
        Verificar y continuar
      </PrimaryButton>
      <div className="flex flex-col gap-1">
        <TextButton href="/forgot-password">Usar un método de recuperación</TextButton>
        <TextButton href="/login">Volver al inicio</TextButton>
      </div>
    </AuthCard>
  );
}
