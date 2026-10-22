import { buildPhoneUrl, buildWhatsAppUrl, CAFE_DETAIL, CAFE_DETAIL_EMPTY, CAFE_DETAIL_LINKS_UNAVAILABLE } from "@/mocks/cafe-info";
import type { CafeAddress, CafeDetail, CafeLinkNetwork, CafeScheduleRow } from "@/mocks/types";

/** Variants that `?state=` can force on `/info`: "Enlaces no disponibles" and "Secciones vacías". */
export const CAFE_INFO_FORCED_STATES = ["unavailable", "empty"] as const;
export type CafeInfoForcedState = (typeof CAFE_INFO_FORCED_STATES)[number];

const FORCED_DETAILS: Record<CafeInfoForcedState, CafeDetail> = {
  unavailable: CAFE_DETAIL_LINKS_UNAVAILABLE,
  empty: CAFE_DETAIL_EMPTY,
};

/** Café data to render; a forced state swaps in the sample data of its design. */
export function getCafeDetail(forced: CafeInfoForcedState | null): CafeDetail {
  return forced ? FORCED_DETAILS[forced] : CAFE_DETAIL;
}

export type ContactChannel = {
  kind: "whatsapp" | "phone";
  /** `null` renders the disabled "No disponible" button. */
  href: string | null;
  /** The first available channel is the filled (primary) button. */
  primary: boolean;
};

export type LinkRow = {
  network: CafeLinkNetwork;
  handle: string;
  /** `null` renders the row dimmed and without action. */
  href: string | null;
};

export type HoursView =
  | { kind: "week"; closesAt: string; rows: CafeScheduleRow[] }
  | { kind: "closed"; reopens: string };

/** What each section shows; `null` means the section renders its empty state. */
export type CafeInfoView = {
  description: string | null;
  location: (Omit<CafeAddress, "mapsUrl"> & { mapsHref: string | null }) | null;
  contact: { channels: ContactChannel[]; showHint: boolean } | null;
  links: { rows: LinkRow[]; showInactiveHint: boolean } | null;
  hours: HoursView | null;
};

/** Trimmed text, or `null` when the value is missing or blank. */
function text(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getContact({ whatsapp, phone }: CafeDetail["contact"]): CafeInfoView["contact"] {
  const whatsappNumber = text(whatsapp);
  const phoneNumber = text(phone);
  if (!whatsappNumber && !phoneNumber) return null;
  const channels: ContactChannel[] = [
    { kind: "whatsapp", href: whatsappNumber ? buildWhatsAppUrl(whatsappNumber) : null, primary: false },
    { kind: "phone", href: phoneNumber ? buildPhoneUrl(phoneNumber) : null, primary: false },
  ];
  const primary = channels.find((channel) => channel.href !== null);
  return {
    channels: channels.map((channel) => ({ ...channel, primary: channel === primary })),
    // The "choose a channel" hint only makes sense when both channels work.
    showHint: channels.every((channel) => channel.href !== null),
  };
}

/** Maps the café data to the sections of the "Detalle del negocio" screen. */
export function getCafeInfoView(detail: CafeDetail): CafeInfoView {
  const street = text(detail.address?.street);
  const city = text(detail.address?.city);
  const rows = detail.links.map(({ network, handle, url }) => ({ network, handle, href: text(url) }));

  let hours: HoursView | null = null;
  if (detail.schedule.length > 0) {
    hours = detail.openStatus.open
      ? { kind: "week", closesAt: detail.openStatus.closesAt, rows: detail.schedule }
      : { kind: "closed", reopens: detail.openStatus.reopens };
  }

  return {
    description: text(detail.description),
    location: street && city ? { street, city, mapsHref: text(detail.address?.mapsUrl) } : null,
    contact: getContact(detail.contact),
    links: rows.length > 0 ? { rows, showInactiveHint: rows.some((row) => row.href === null) } : null,
    hours,
  };
}
