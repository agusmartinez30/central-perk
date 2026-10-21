import { BellRing, LoaderCircle, LockKeyhole, type LucideIcon } from "lucide-react";
import { TABLE } from "@/mocks/table";
import type { NoticeTone } from "@/shared/ui";
import type { BillRequestView } from "./bill-request";

type NoticeCopy = { tone: NoticeTone; icon?: LucideIcon; title: string; text: string };

/** State alerts of 08B–F, exactly as in the exports. */
export const BILL_REQUEST_ALERTS: Partial<Record<BillRequestView, NoticeCopy>> = {
  sending: {
    tone: "warning",
    icon: LoaderCircle,
    title: "Estamos enviando tu solicitud",
    text: "Esperá un momento mientras validamos el estado y el total de la mesa.",
  },
  updated: {
    tone: "warning",
    title: "El total de la mesa cambió",
    text: "Se confirmó un nuevo consumo. Revisá el importe actualizado antes de continuar.",
  },
  error: {
    tone: "error",
    title: "No pudimos enviar la solicitud",
    text: "Revisá tu conexión. La cuenta sigue abierta y no se pausaron los pedidos.",
  },
  requested: {
    tone: "info",
    icon: BellRing,
    title: "La cuenta ya fue solicitada",
    text: "El equipo del restaurante recibió el aviso y se acercará a la mesa.",
  },
  closed: {
    tone: "info",
    icon: LockKeyhole,
    title: "La cuenta ya está cerrada",
    text: "El pago fue registrado por el personal y no admite nuevas solicitudes.",
  },
};

/** Second (info) notice of 08C, 08E and 08F. */
export const BILL_REQUEST_INFO: Partial<Record<BillRequestView, NoticeCopy>> = {
  error: {
    tone: "info",
    title: "Conservamos tu selección",
    text: "No registramos la solicitud. Reintentá cuando recuperes la conexión.",
  },
  requested: {
    tone: "info",
    title: "Solicitud registrada",
    text: "El personal ya fue avisado. Para evitar duplicados, no podés volver a solicitar la cuenta.",
  },
  closed: {
    tone: "info",
    title: "Sesión finalizada",
    text: "Solo el personal puede registrar el pago, cerrar o reabrir una mesa.",
  },
};

/** Hero and consequence copy of the locked variants (08C, 08F). */
export const BILL_REQUEST_LOCKED = {
  requested: {
    line: "¿Pedimos",
    accent: "la cuenta?",
    supporting: "Vamos a avisarle al personal que tu mesa está lista para pagar.",
    artOpacity: 1,
    caption: "Importe pendiente de pago",
    consequence: "Los nuevos pedidos permanecen pausados hasta que el personal reactive la mesa.",
  },
  closed: {
    line: "La cuenta está",
    accent: "cerrada.",
    supporting: `La sesión de la mesa ${TABLE.number} ya finalizó.`,
    artOpacity: 0.55,
    caption: "Importe final registrado",
    consequence: "Las acciones de pedir y solicitar cuenta están desactivadas.",
  },
} as const;

export const ERROR_CONSEQUENCE =
  "Verificaremos el estado de la cuenta antes de volver a enviar la solicitud.";
