import type { ComponentType } from "react";
import { Globe } from "lucide-react";
import type { CafeLinkNetwork } from "@/mocks/types";
import { FacebookIcon, InstagramIcon } from "./BrandIcons";

type IconComponent = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" }>;

/** UI copy of the "Detalle del negocio" screen, as in the designs. */
export const CAFE_INFO_COPY = {
  title: "Detalle del negocio",
  openNow: "Abierto ahora",
  // Not in the designs (every export shows the café open): the chip while it is closed.
  closedNow: "Cerrado",
  unavailable: "No disponible",
  description: { emptyTitle: "Sin descripción", emptyText: "Este negocio todavía no agregó una descripción." },
  location: {
    title: "Dónde estamos",
    maps: "Ver en Google Maps",
    mapsUnavailable: "Google Maps no disponible",
    emptyTitle: "Ubicación no informada",
    emptyText: "El negocio todavía no publicó su dirección.",
  },
  contact: {
    title: "Contacto",
    hint: "Elegí cómo querés comunicarte.",
    whatsapp: "WhatsApp",
    phone: "Llamar",
    emptyTitle: "Sin datos de contacto",
    emptyText: "No hay teléfono ni WhatsApp publicados por el momento.",
  },
  links: {
    title: "También online",
    inactiveHint: "Los enlaces inactivos se muestran sin acción.",
    emptyTitle: "Sin enlaces publicados",
    emptyText: "Las redes y el sitio web aparecerán acá cuando estén disponibles.",
  },
  hours: {
    title: "Horarios",
    openUntil: (time: string) => `Abierto hasta las ${time}`,
    closedDay: "Cerrado",
    closedToday: "Cerrado hoy",
    reopens: (when: string) => `Abre ${when}`,
    emptyTitle: "Horarios no informados",
    emptyText: "Consultá directamente con el negocio antes de visitarlo.",
  },
} as const;

export const LINK_META: Record<CafeLinkNetwork, { name: string; icon: IconComponent }> = {
  instagram: { name: "Instagram", icon: InstagramIcon },
  facebook: { name: "Facebook", icon: FacebookIcon },
  website: { name: "Sitio web", icon: Globe },
};
