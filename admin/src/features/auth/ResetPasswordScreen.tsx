"use client";

import { useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { delay } from "@/shared/lib/delay";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { Notice, PasswordField, PrimaryButton } from "@/shared/ui";
import { AuthCard } from "./AuthCard";
import { PasswordRequirementsList } from "./PasswordRequirementsList";
import { getPasswordRequirements, validateResetPassword, type ResetPasswordError } from "./validation";

/** `?state=mismatch` / `?state=success` force the error and completed variants. */
export const RESET_PASSWORD_FORCED_STATES = ["mismatch", "success"] as const;

const ERROR_COPY: Record<ResetPasswordError, string> = {
  requirements: "La contraseña todavía no cumple todos los requisitos.",
  mismatch: "Las contraseñas no coinciden.",
};

/** 11C · Reset Password (reached from the emailed one-time link). */
export function ResetPasswordScreen() {
  const forcedState = useScreenState(RESET_PASSWORD_FORCED_STATES);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<ResetPasswordError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const shownError = error ?? (forcedState === "mismatch" ? "mismatch" : null);
  const completed = done || forcedState === "success";

  const handleSubmit = async () => {
    if (completed) return;
    const problem = validateResetPassword(password, confirmation);
    setError(problem);
    if (problem) return;
    setSubmitting(true);
    await delay(600);
    setSubmitting(false);
    setDone(true);
  };

  return (
    <AuthCard
      eyebrow="ENLACE VÁLIDO · 14 MIN RESTANTES"
      title="Nueva contraseña"
      description="Elegí una contraseña segura para volver a ingresar."
      onSubmit={handleSubmit}
    >
      <PasswordField
        id="reset-password"
        label="Nueva contraseña"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        invalid={shownError === "requirements"}
        disabled={completed}
      />
      <PasswordField
        id="reset-confirmation"
        label="Confirmar contraseña"
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        invalid={shownError === "mismatch"}
        disabled={completed}
      />
      <PasswordRequirementsList requirements={getPasswordRequirements(password)} />
      {shownError && !completed && (
        <Notice tone="danger" icon={CircleAlert}>
          {ERROR_COPY[shownError]}
        </Notice>
      )}
      {completed ? (
        <>
          <Notice tone="success" icon={CircleCheck} title="Contraseña actualizada">
            Ya podés ingresar con tu nueva contraseña.
          </Notice>
          <PrimaryButton href="/login">Ir al inicio de sesión</PrimaryButton>
        </>
      ) : (
        <PrimaryButton type="submit" loading={submitting}>
          Restablecer contraseña
        </PrimaryButton>
      )}
      <p className="text-[10px] text-muted">El enlace es de un solo uso y vence pronto.</p>
    </AuthCard>
  );
}
