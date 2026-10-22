import type { ReactNode } from "react";
import {
  Camera,
  ChevronRight,
  Clock,
  Coffee,
  ExternalLink,
  Globe,
  MapPin,
  MessageCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CAFE_INFO } from "@/mocks/cafe-info";
import { TABLE } from "@/mocks/table";
import type { SocialNetwork } from "@/mocks/types";
import { ScreenHeader } from "@/shared/ui";

// lucide-react dropped brand icons, so Instagram and Facebook use generic fallbacks.
const SOCIAL_META: Record<SocialNetwork, { name: string; icon: LucideIcon }> = {
  instagram: { name: "Instagram", icon: Camera },
  facebook: { name: "Facebook", icon: Users },
  whatsapp: { name: "WhatsApp", icon: MessageCircle },
  website: { name: "Sitio web", icon: Globe },
};

const card = "flex flex-col gap-3 rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line outline-solid";

type InfoCardProps = {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
};

function InfoCard({ title, icon: Icon, children }: InfoCardProps) {
  return (
    <section aria-label={title} className={card}>
      <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
        <Icon size={17} className="text-brand" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Business info: café name, location, opening hours and social networks. */
export function CafeInfoScreen() {
  const { name, tagline, address, area, mapsUrl, openingHours, socials } = CAFE_INFO;

  return (
    <>
      <ScreenHeader title="Información" backHref="/menu" table={TABLE.number} className="mt-2" />
      <main className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-6">
        <div className="flex items-center gap-3 rounded-panel bg-brand p-4 text-white">
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-surface text-brand">
            <Coffee size={23} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-[18px] leading-none font-bold">{name}</p>
            <p className="text-[11px] leading-[14px] text-white/75">{tagline}</p>
          </div>
        </div>

        <InfoCard title="Ubicación" icon={MapPin}>
          <div className="flex flex-col gap-0.5">
            <p className="text-[13px] font-bold text-ink">{address}</p>
            <p className="text-[11px] text-muted">{area}</p>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 items-center justify-center gap-1.5 rounded-button bg-brand-tint text-[12px] font-bold text-brand"
          >
            Cómo llegar
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </InfoCard>

        <InfoCard title="Horarios" icon={Clock}>
          <dl className="flex flex-col">
            {openingHours.map(({ days, hours }) => (
              <div
                key={days}
                className="flex items-center justify-between border-t border-line py-2 first:border-t-0 first:pt-0 last:pb-0"
              >
                <dt className="text-[12px] text-ink-2">{days}</dt>
                <dd className="text-[12px] font-bold text-ink">{hours}</dd>
              </div>
            ))}
          </dl>
        </InfoCard>

        <InfoCard title="Redes sociales" icon={Globe}>
          <ul className="flex flex-col gap-2">
            {socials.map(({ network, label, url }) => {
              const { name: networkName, icon: Icon } = SOCIAL_META[network];
              return (
                <li key={network}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-field bg-brand-soft px-3 py-2.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-brand">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-[12px] font-bold text-ink">{networkName}</span>
                      <span className="truncate text-[10.5px] text-muted">{label}</span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </InfoCard>
      </main>
    </>
  );
}
