import {
  ArrowRight,
  Ban,
  BellRing,
  BookOpen,
  Check,
  CircleCheck,
  CircleDot,
  Clock,
  ConciergeBell,
  History,
  House,
  LockKeyhole,
  LogOut,
  ReceiptText,
  RefreshCw,
  UserCheck,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { TABLE } from "@/mocks/table";
import type { PaymentPreference } from "@/features/table-session";
import type { BillStatusForcedState } from "./bill-status";

/** What a footer action does; the screen wires each one to a route or a handler. */
export type BillStatusAction =
  | { kind: "link"; href: string }
  | { kind: "table" }
  | { kind: "retry" }
  | { kind: "finish" }
  | { kind: "disabled"; muted?: boolean };

type ActionCopy = { label: string; icon: LucideIcon; action: BillStatusAction };

export type BillStatusCopy = {
  title: string;
  titleSize?: number;
  /** Ignored for `requested`, whose supporting line follows the payment preference. */
  supporting: string;
  artOpacity?: number;
  statusLabel: string;
  statusIcon: LucideIcon;
  /** Null for `requested`: the line names the chosen preference. */
  paymentLabel: string | null;
  paymentIcon: LucideIcon;
  notice: string;
  primary: ActionCopy;
  secondary: ActionCopy;
  note: string;
};

/** 09 supporting line per payment preference; only "En caja" exists in the exports. */
export const REQUESTED_SUPPORTING: Record<PaymentPreference, string> = {
  cashier: "Podés acercarte a la caja para abonar.",
  table: "El personal se acerca a tu mesa para cobrar.",
  transfer: "El personal te indicará los datos para la transferencia.",
};

/** Copy of screen 09 and its 09A–E variants, exactly as in the exports. */
export const BILL_STATUS_COPY: Record<BillStatusForcedState, BillStatusCopy> = {
  requested: {
    title: "¡Listo!",
    supporting: REQUESTED_SUPPORTING.cashier,
    statusLabel: "Cuenta solicitada",
    statusIcon: BellRing,
    paymentLabel: null,
    paymentIcon: Clock,
    notice:
      "La solicitud no acredita el pago. El personal puede registrar otro método, verificar el cobro y cerrar la mesa.",
    primary: { label: "Solicitud enviada", icon: Check, action: { kind: "disabled" } },
    secondary: { label: "Ver la carta", icon: BookOpen, action: { kind: "link", href: "/menu" } },
    note: "Pago pendiente · La mesa se cierra solo cuando el personal confirma el cobro.",
  },
  attending: {
    title: "¡Ya están al tanto!",
    supporting: "El equipo está gestionando la solicitud de tu mesa.",
    statusLabel: "Personal atendiendo",
    statusIcon: UserCheck,
    paymentLabel: "Pago pendiente · Se realiza en el local",
    paymentIcon: Clock,
    notice:
      "Podés consultar el detalle mientras el personal atiende la mesa. No hay un tiempo de espera estimado.",
    primary: { label: "Ver detalle de la cuenta", icon: ReceiptText, action: { kind: "table" } },
    secondary: { label: "Ver la carta", icon: BookOpen, action: { kind: "link", href: "/menu" } },
    note: "Estado sincronizado entre los dispositivos autorizados de la mesa.",
  },
  closed: {
    title: "¡Gracias por visitarnos!",
    supporting: "El personal registró el pago y cerró la sesión de la mesa.",
    statusLabel: "Cuenta cerrada",
    statusIcon: LockKeyhole,
    paymentLabel: "Pago registrado por el personal",
    paymentIcon: CircleCheck,
    notice: "La sesión terminó. El resumen final queda disponible para consultar.",
    primary: { label: "Ver resumen final", icon: ReceiptText, action: { kind: "table" } },
    secondary: { label: "Finalizar", icon: LogOut, action: { kind: "finish" } },
    note: "Pago registrado y mesa cerrada exclusivamente por el personal.",
  },
  reopened: {
    title: "La mesa está activa otra vez",
    supporting: "El personal reabrió la cuenta y ya podés volver a pedir.",
    statusLabel: "Cuenta abierta",
    statusIcon: CircleDot,
    paymentLabel: "Cuenta reabierta por el personal",
    paymentIcon: RefreshCw,
    notice: `Los nuevos pedidos volverán a sumarse a esta cuenta compartida de la mesa ${TABLE.number}.`,
    primary: { label: "Volver al menú", icon: ArrowRight, action: { kind: "link", href: "/menu" } },
    secondary: { label: "Ver mi mesa", icon: ConciergeBell, action: { kind: "table" } },
    note: "La reapertura fue autorizada por el personal del restaurante.",
  },
  offline: {
    title: "No pudimos verificar el estado",
    supporting: "Conservamos la última información conocida de la cuenta.",
    artOpacity: 0.65,
    statusLabel: "Último estado conocido",
    statusIcon: History,
    paymentLabel: "Estado actual sin verificar",
    paymentIcon: WifiOff,
    notice:
      "El estado puede haber cambiado en otro dispositivo. Reconectate antes de realizar acciones.",
    primary: { label: "Reintentar", icon: RefreshCw, action: { kind: "retry" } },
    secondary: { label: "Ver último detalle", icon: History, action: { kind: "table" } },
    note: "Mostramos la última información guardada en este dispositivo.",
  },
  invalid: {
    title: "Esta sesión ya no está disponible",
    titleSize: 31,
    supporting: "El QR puede haber vencido o la mesa ya inició una nueva sesión.",
    artOpacity: 0.35,
    statusLabel: "",
    statusIcon: Ban,
    paymentLabel: null,
    paymentIcon: Ban,
    notice: "",
    primary: { label: "Sesión no disponible", icon: Ban, action: { kind: "disabled", muted: true } },
    secondary: { label: "Volver al inicio", icon: House, action: { kind: "link", href: "/" } },
    note: "Escaneá un nuevo QR o consultá al personal.",
  },
};

/** `/table` variant that matches a forced 09 variant, so previews stay consistent. */
export const TABLE_STATE_FOR_STATUS: Partial<Record<BillStatusForcedState, string>> = {
  requested: "requested",
  attending: "requested",
  closed: "closed",
  offline: "error",
};
