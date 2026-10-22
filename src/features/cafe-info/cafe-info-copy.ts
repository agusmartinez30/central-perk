import type { ComponentType } from "react";
import { Globe } from "lucide-react";
import type { CafeLinkNetwork } from "@/mocks/types";
import { FacebookIcon, InstagramIcon } from "./BrandIcons";

type IconComponent = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" }>;

/** UI copy of the "Detalle del negocio" screen, as in the designs. */
export const CAFE_INFO_COPY = {
  title: "Detalle del negocio",
  openNow: "Abierto ahora",
  location: { title: "Dónde estamos", maps: "Ver en Google Maps" },
  contact: { title: "Contacto", hint: "Elegí cómo querés comunicarte.", whatsapp: "WhatsApp", phone: "Llamar" },
  links: { title: "También online" },
  hours: {
    title: "Horarios",
    openUntil: (time: string) => `Abierto hasta las ${time}`,
    closedDay: "Cerrado",
  },
} as const;

export const LINK_META: Record<CafeLinkNetwork, { name: string; icon: IconComponent }> = {
  instagram: { name: "Instagram", icon: InstagramIcon },
  facebook: { name: "Facebook", icon: FacebookIcon },
  website: { name: "Sitio web", icon: Globe },
};
