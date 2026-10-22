import { TABLE } from "./table";
import type { CafeInfo } from "./types";

/** Google Maps search link for a free-form address. */
export function buildMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
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
