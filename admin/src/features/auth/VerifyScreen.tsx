"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Info } from "lucide-react";
import { DEMO_STAFF } from "@/mocks/staff";
import { verifyStaffMfaCode } from "@/mocks/auth";
import { delay } from "@/shared/lib/delay";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { Notice, PrimaryButton, TextButton } from "@/shared/ui";
import { AuthCard } from "./AuthCard";
import { CodeInput } from "./CodeInput";
import { completeSession, readSession } from "./session";
import { isValidMfaCode } from "./validation";

/** `?state=error` shows the wrong-code message without submitting. */
export const VERIFY_FORCED_STATES = ["error"] as const;

type VerifyError = "incomplete" | "wrong-code";

const ERROR_COPY: Record<VerifyError, string> = {
  incomplete: "Ingresá los 6 dígitos del código.",
  "wrong-code": "El código no es correcto. Probá con el código actual de tu aplicación.",
};

/** 11D · Multi-Factor Verification. */
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
    await delay(600);
    if (!verifyStaffMfaCode(code)) {
      setSubmitting(false);
      setError("wrong-code");
      return;
    }
    // Reaching /verify directly (no pending login) signs in the seeded staff member.
    completeSession(readSession()?.staffId ?? DEMO_STAFF.id);
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
