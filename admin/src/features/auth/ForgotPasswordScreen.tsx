"use client";

import { useState } from "react";
import { ArrowLeft, CircleAlert, Mail, MailCheck } from "lucide-react";
import { delay } from "@/shared/lib/delay";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { Notice, PrimaryButton, TextButton, TextField } from "@/shared/ui";
import { AuthCard } from "./AuthCard";
import { isValidEmail } from "./validation";

/** `?state=sent` shows the generic confirmation, as in the 11B export. */
export const FORGOT_PASSWORD_FORCED_STATES = ["sent"] as const;

/** 11B · Forgot Password. The confirmation is identical for any address (no account probing). */
export function ForgotPasswordScreen() {
  const forcedState = useScreenState(FORGOT_PASSWORD_FORCED_STATES);
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const showConfirmation = sent || forcedState === "sent";

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setSubmitting(true);
    await delay(600);
    setSubmitting(false);
    setSent(true);
  };

  return (
    <AuthCard
      eyebrow="RECUPERACIÓN SEGURA"
      title="Recuperar contraseña"
      description="Ingresá tu correo laboral para recibir instrucciones."
      onSubmit={handleSubmit}
    >
      <TextField
        id="recovery-email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="tu.correo@restaurante.com"
        icon={Mail}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={invalid}
      />
      {invalid && (
        <Notice tone="danger" icon={CircleAlert}>
          Ingresá un correo electrónico válido.
        </Notice>
      )}
      <PrimaryButton type="submit" loading={submitting}>
        Enviar instrucciones
      </PrimaryButton>
      <TextButton href="/login" icon={ArrowLeft}>
        Volver al inicio
      </TextButton>
      {showConfirmation && (
        <Notice tone="success" icon={MailCheck} title="Revisá tu correo">
          Si el correo está asociado a una cuenta, vas a recibir instrucciones para recuperar el
          acceso.
        </Notice>
      )}
      <p className="text-center text-[10px] text-muted">
        Por seguridad, mostramos la misma confirmación para cualquier dirección.
      </p>
    </AuthCard>
  );
}
