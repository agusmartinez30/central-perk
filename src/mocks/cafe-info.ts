import { TABLE } from "./table";
import type { CafeDetail, CafeInfo } from "./types";

/** Google Maps search link for a free-form address. */
export function buildMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** WhatsApp chat link for a formatted international number. */
export function buildWhatsAppUrl(phone: string): string {
  return `https://wa.me/${digitsOf(phone)}`;
}

/** `tel:` link for a formatted international number. */
export function buildPhoneUrl(phone: string): string {
  return `tel:+${digitsOf(phone)}`;
}

const ADDRESS = "Av. Corrientes 1234";
const AREA = "San Nicolás, CABA";

// Sample data: replace with the café's real details.
export const CAFE_INFO: CafeInfo = {
  name: TABLE.cafeName,
  tagline: "Café de especialidad, medialunas recién horneadas y una mesa para quedarse.",
  address: ADDRESS,
  area: AREA,
  mapsUrl: buildMapsUrl(`${ADDRESS}, ${AREA}`),
  openingHours: [
    { days: "Lunes a viernes", hours: "7:30 – 20:00" },
    { days: "Sábados", hours: "8:30 – 20:30" },
    { days: "Domingos y feriados", hours: "9:00 – 14:00" },
  ],
  socials: [
    { network: "instagram", label: "@cafecentral", url: "https://instagram.com/cafecentral" },
    { network: "facebook", label: "Café Central", url: "https://facebook.com/cafecentral" },
    { network: "whatsapp", label: "+54 9 11 1234-5678", url: "https://wa.me/5491112345678" },
    { network: "website", label: "cafecentral.com.ar", url: "https://cafecentral.com.ar" },
  ],
};

const STREET = "Av. del Libertador 124";
const CITY = "Alta Gracia, Córdoba";
const PHONE = "+54 9 3547 55-5124";

// Sample data from the "Detalle completo" design: replace with the café's real details.
export const CAFE_DETAIL: CafeDetail = {
  name: TABLE.cafeName,
  description: "Un espacio para disfrutar de un buen café, compartir y hacer una pausa.",
  coverImage: "/assets/cafe-cover.webp",
  address: { street: STREET, city: CITY, mapsUrl: buildMapsUrl(`${STREET}, ${CITY}`) },
  contact: { whatsapp: PHONE, phone: PHONE },
  links: [
    { network: "instagram", handle: "@cafecentral.demo", url: "https://instagram.com/cafecentral.demo" },
    { network: "facebook", handle: "Café Central Alta Gracia", url: "https://facebook.com/cafecentral.demo" },
    { network: "website", handle: "cafecentral.demo", url: "https://cafecentral.demo" },
  ],
  schedule: [
    { days: "Lunes a viernes", hours: "08:00 – 20:00" },
    { days: "Sábado", hours: "09:00 – 21:00" },
    { days: "Domingo", hours: null },
  ],
  openStatus: { open: true, closesAt: "20:00" },
};

/** "Enlaces no disponibles": no map link, no WhatsApp, two inactive profiles, closed today. */
export const CAFE_DETAIL_LINKS_UNAVAILABLE: CafeDetail = {
  ...CAFE_DETAIL,
  address: { street: STREET, city: CITY, mapsUrl: null },
  contact: { whatsapp: null, phone: PHONE },
  links: CAFE_DETAIL.links.map((link) => (link.network === "facebook" ? link : { ...link, url: null })),
  openStatus: { open: false, reopens: "mañana a las 08:00" },
};

/** "Secciones vacías": the café has not published anything beyond its name. */
export const CAFE_DETAIL_EMPTY: CafeDetail = {
  ...CAFE_DETAIL,
  description: null,
  address: null,
  contact: { whatsapp: null, phone: null },
  links: [],
  schedule: [],
};
