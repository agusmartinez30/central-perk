import {
  BellRing,
  CircleDot,
  Info,
  LockKeyhole,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { TABLE } from "@/mocks/table";
import type { TableView } from "./table-view";

type FooterCopy = {
  primaryLabel: string;
  secondaryLabel: string;
  secondaryEnabled: boolean;
  hint?: string;
};

export type TableViewCopy = {
  /** Two-line editorial heading (07, 07C) or a single display heading (07A, 07B, 07D). */
  heading:
    | { kind: "editorial"; line: string; accent: string; supporting?: string }
    | { kind: "display"; title: string; supporting: string };
  statusLabel: string;
  statusIcon: LucideIcon;
  statusMeta: string;
  paymentLabel: string;
  historyHint: string;
  notice?: { icon: LucideIcon; text: string };
  note?: string;
  footer: FooterCopy;
};

/** Copy of screen 07 and its variants, exactly as in the exports. */
export const TABLE_VIEW_COPY: Record<TableView, TableViewCopy> = {
  open: {
    heading: {
      kind: "editorial",
      line: "Lo bueno se",
      accent: "comparte.",
      supporting: "Todos los pedidos de tu mesa, en un solo lugar.",
    },
    statusLabel: "Cuenta abierta",
    statusIcon: CircleDot,
    statusMeta: "Actualizado en tiempo real",
    paymentLabel: "Pendiente de pago",
    historyHint: "Tocá para ver el detalle",
    notice: {
      icon: Info,
      text: "Podés seguir pidiendo. Todos los nuevos pedidos se sumarán a esta cuenta.",
    },
    note: "El total compartido excluye productos cancelados.",
    footer: {
      primaryLabel: "Solicitar cuenta",
      secondaryLabel: "Pedir algo más",
      secondaryEnabled: true,
    },
  },
  requested: {
    heading: {
      kind: "display",
      title: "Cuenta solicitada",
      supporting: "El equipo del restaurante ya fue notificado.",
    },
    statusLabel: "Cuenta solicitada",
    statusIcon: BellRing,
    statusMeta: `Mesa ${TABLE.number}`,
    paymentLabel: "Pago pendiente",
    historyHint: "Historial disponible",
    notice: {
      icon: Info,
      text: "El equipo fue notificado. Los pedidos están pausados mientras acercan la cuenta.",
    },
    note: "Para evitar duplicados, no se puede volver a solicitar la cuenta.",
    footer: {
      primaryLabel: "Cuenta ya solicitada",
      secondaryLabel: "Pedidos pausados",
      secondaryEnabled: false,
      hint: "El equipo se acercará para cobrar",
    },
  },
  closed: {
    heading: {
      kind: "display",
      title: "Cuenta cerrada",
      supporting: `Resumen final de la sesión de la mesa ${TABLE.number}.`,
    },
    statusLabel: "Cuenta cerrada",
    statusIcon: LockKeyhole,
    statusMeta: `Mesa ${TABLE.number}`,
    paymentLabel: "Pago registrado",
    historyHint: "Historial disponible",
    notice: {
      icon: Info,
      text: "La sesión de la mesa finalizó. El historial queda disponible como resumen.",
    },
    note: "Solo el personal registra el pago y cierra la mesa.",
    footer: {
      primaryLabel: "Cuenta cerrada",
      secondaryLabel: "Pedidos desactivados",
      secondaryEnabled: false,
      hint: "Pago registrado por el personal",
    },
  },
  error: {
    heading: {
      kind: "display",
      title: "Error de conexión",
      supporting: "Mostramos la última información disponible.",
    },
    statusLabel: "Error de conexión",
    statusIcon: WifiOff,
    // The time is filled in by the screen from the latest known order.
    statusMeta: "Última actualización",
    paymentLabel: "Último estado",
    historyHint: "Historial disponible",
    notice: {
      icon: WifiOff,
      text: "No pudimos actualizar la cuenta. Reintentá para confirmar pedidos y totales.",
    },
    note: "Los totales pueden estar desactualizados hasta recuperar la conexión.",
    footer: {
      primaryLabel: "Reintentar",
      secondaryLabel: "Sin conexión",
      secondaryEnabled: false,
      hint: "Conservamos la última información recibida",
    },
  },
  empty: {
    heading: { kind: "editorial", line: "La mesa está", accent: "lista para compartir." },
    statusLabel: "Cuenta abierta",
    statusIcon: CircleDot,
    statusMeta: "Actualizado ahora",
    paymentLabel: "Sin consumos",
    historyHint: "",
    footer: {
      primaryLabel: "Explorar el menú",
      secondaryLabel: "",
      secondaryEnabled: false,
      hint: "Los pedidos confirmados se sincronizan en tiempo real",
    },
  },
};
