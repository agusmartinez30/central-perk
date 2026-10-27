import type { AuthErrorCode } from "./auth-api";

/** Errors the login screen can show after a request (client-side validation is separate). */
export type LoginRequestError = "invalid-credentials" | "throttled" | "unavailable";

/** Errors the verify screen can show after a request; `session-expired` sends back to `/login`. */
export type VerifyRequestError = "wrong-code" | "throttled" | "session-expired" | "unavailable";

export function toLoginError(code: AuthErrorCode): LoginRequestError {
  if (code === "invalid-credentials" || code === "throttled") return code;
  return "unavailable";
}

export function toVerifyError(code: AuthErrorCode): VerifyRequestError {
  if (code === "wrong-code" || code === "throttled") return code;
  if (code === "invalid-session") return "session-expired";
  return "unavailable";
}

/** Shared copy for request errors that both screens show. */
export const REQUEST_ERROR_COPY = {
  throttled: "Demasiados intentos. Esperá un minuto y volvé a intentar.",
  unavailable: "No pudimos conectarnos con el servidor. Probá de nuevo en unos segundos.",
} as const;
