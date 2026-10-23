"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, LockKeyhole, Mail } from "lucide-react";
import { authenticateStaff } from "@/mocks/auth";
import { delay } from "@/shared/lib/delay";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { Checkbox, Notice, PasswordField, PrimaryButton, TextField } from "@/shared/ui";
import { AuthCard } from "./AuthCard";
import { writeSession } from "./session";
import { isValidEmail } from "./validation";

/** `?state=error` shows the invalid-credentials message without submitting. */
export const LOGIN_FORCED_STATES = ["error"] as const;

type LoginError = "invalid-email" | "invalid-credentials";

const ERROR_COPY: Record<LoginError, string> = {
  "invalid-email": "Ingresá un correo electrónico válido.",
  "invalid-credentials": "El correo o la contraseña no son correctos.",
};

/** 11A · Staff Login. */
export function LoginScreen() {
  const router = useRouter();
  const forcedState = useScreenState(LOGIN_FORCED_STATES);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const shownError: LoginError | null =
    error ?? (forcedState === "error" ? "invalid-credentials" : null);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError("invalid-email");
      return;
    }
    setError(null);
    setSubmitting(true);
    await delay(600);
    const result = authenticateStaff(email, password);
    if (!result.ok) {
      setSubmitting(false);
      setError("invalid-credentials");
      return;
    }
    writeSession({ stage: "mfa-pending", staffId: result.staff.id }, remember);
    router.push("/verify");
  };

  return (
    <AuthCard
      eyebrow="ACCESO DE PERSONAL"
      title="Bienvenido de nuevo"
      description="Ingresá con tu cuenta del restaurante."
      onSubmit={handleSubmit}
    >
      <TextField
        id="login-email"
        label="Correo electrónico"
        type="email"
        autoComplete="username"
        placeholder="turno@cafecentral.com"
        icon={Mail}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        invalid={shownError !== null}
      />
      <PasswordField
        id="login-password"
        label="Contraseña"
        autoComplete="current-password"
        placeholder="••••••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        invalid={shownError === "invalid-credentials"}
      />
      {shownError && (
        <Notice tone="danger" icon={CircleAlert}>
          {ERROR_COPY[shownError]}
        </Notice>
      )}
      <div className="flex items-center justify-between">
        <Checkbox
          id="login-remember"
          label="Recordarme en este dispositivo"
          checked={remember}
          onChange={setRemember}
        />
        <Link href="/forgot-password" className="text-[11px] font-bold text-brand hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <PrimaryButton type="submit" loading={submitting}>
        Iniciar sesión
      </PrimaryButton>
      <p className="text-center text-[11px]/[15px] text-muted">
        ¿Todavía no tenés una cuenta? Solicitá acceso al administrador.
      </p>
      <div className="flex items-center justify-center gap-2">
        <LockKeyhole size={14} aria-hidden="true" className="text-muted" />
        <p className="text-[9px] text-muted">Acceso seguro · Sesión administrada</p>
      </div>
    </AuthCard>
  );
}
