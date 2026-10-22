import { Map as MapIcon, MapPin, MessageCircle, Phone } from "lucide-react";
import { CAFE_DETAIL } from "@/mocks/cafe-info";
import { ScreenHeader, StatusPill } from "@/shared/ui";
import { CafeActionButton } from "./CafeActionButton";
import { CafeCover } from "./CafeCover";
import { CafeLinkRow } from "./CafeLinkRow";
import { CafeSection } from "./CafeSection";
import { HoursTable } from "./HoursTable";
import { CAFE_INFO_COPY as copy } from "./cafe-info-copy";
import { getCafeInfoView } from "./cafe-info-view";

const CHANNEL_META = {
  whatsapp: { label: copy.contact.whatsapp, icon: MessageCircle, external: true },
  phone: { label: copy.contact.phone, icon: Phone, external: false },
} as const;

/** "Detalle del negocio": cover, identity, location, contact, links and opening hours. */
export function CafeInfoScreen() {
  const detail = CAFE_DETAIL;
  const { description, location, contact, links, hours } = getCafeInfoView(detail);

  return (
    <>
      <ScreenHeader variant="centered" title={copy.title} backHref="/menu" />
      <CafeCover src={detail.coverImage} statusLabel={copy.openNow} open={detail.openStatus.open} />

      <main className="flex flex-1 flex-col gap-6 px-4 pt-2.5 pb-[30px]">
        <div className="flex flex-col gap-2">
          <p className="font-display text-[30px] leading-[30px] font-bold text-ink">{detail.name}</p>
          {description ? <p className="text-[14px] leading-5 text-muted">{description}</p> : null}
        </div>

        {location ? (
          <CafeSection title={copy.location.title}>
            <div className="flex items-center gap-3">
              <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand">
                <MapPin size={19} aria-hidden="true" />
              </span>
              <address className="flex flex-1 flex-col gap-0.5 not-italic">
                <span className="text-[13px] font-bold text-ink">{location.street}</span>
                <span className="text-[11px] text-muted">{location.city}</span>
              </address>
            </div>
            <CafeActionButton label={copy.location.maps} icon={MapIcon} href={location.mapsHref} external />
          </CafeSection>
        ) : null}

        {contact ? (
          <CafeSection title={copy.contact.title} hint={contact.showHint ? copy.contact.hint : undefined}>
            <div className="flex gap-2.5">
              {contact.channels.map(({ kind, href, primary }) => {
                const meta = CHANNEL_META[kind];
                return (
                  <CafeActionButton
                    key={kind}
                    label={meta.label}
                    icon={meta.icon}
                    href={href}
                    tone={primary ? "primary" : "neutral"}
                    external={meta.external}
                    className="flex-1"
                  />
                );
              })}
            </div>
          </CafeSection>
        ) : null}

        {links ? (
          <CafeSection title={copy.links.title} className="gap-1">
            <ul className="flex flex-col gap-1">
              {links.rows.map((row) => (
                <li key={row.network}>
                  <CafeLinkRow {...row} />
                </li>
              ))}
            </ul>
          </CafeSection>
        ) : null}

        {hours?.kind === "week" ? (
          <CafeSection
            title={copy.hours.title}
            aside={
              <StatusPill tone="success" className="h-7! rounded-[14px]! px-2.5! text-[10px]!">
                {copy.hours.openUntil(hours.closesAt)}
              </StatusPill>
            }
          >
            <HoursTable rows={hours.rows} />
          </CafeSection>
        ) : null}
      </main>
    </>
  );
}
