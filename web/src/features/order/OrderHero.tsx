import Image from "next/image";
import { Armchair, Sparkle, Sparkles, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { LINE_ART_SRC } from "@/features/menu";

type OrderHeroProps = {
  cafeName: string;
  table: string;
  badgeIcon: LucideIcon;
  badgeLabel: string;
  /** Spins the badge icon (pending state). */
  spinBadgeIcon?: boolean;
  headline: string;
  /** Headline size in px; the designs use 32–38. */
  headlineSize?: number;
  text: string;
  /** Line-art opacity: 1 on success, dimmed for the other states. */
  artOpacity?: number;
  sparkles?: boolean;
};

/** Blue 300px hero shared by screen 06 and its 06A–C variants. */
export function OrderHero({
  cafeName,
  table,
  badgeIcon: BadgeIcon,
  badgeLabel,
  spinBadgeIcon = false,
  headline,
  headlineSize = 32,
  text,
  artOpacity = 1,
  sparkles = false,
}: OrderHeroProps) {
  return (
    // Same full-bleed technique as BillStatusHero: the shadow paints past the 390px column, the clip stops it at the bottom edge.
    <section className="relative h-[300px] w-full shrink-0 overflow-hidden bg-brand text-white shadow-[0_0_0_100vmax_var(--color-brand)] [clip-path:inset(-100vmax_-100vmax_0)]">
      <div className="absolute inset-x-5 top-3 flex h-9 items-center justify-between">
        <span className="text-[11px] font-bold tracking-[1.4px]">{cafeName.toUpperCase()}</span>
        <span className="flex h-[30px] items-center gap-1.5 rounded-[15px] bg-surface px-2.5 text-brand">
          <Armchair size={13} aria-hidden="true" />
          <span className="text-[10.5px] font-bold">Mesa {table}</span>
        </span>
      </div>

      <div
        className="absolute inset-x-5 top-[72px] h-[136px] overflow-hidden"
        style={{ opacity: artOpacity }}
        aria-hidden="true"
      >
        <Image
          src={LINE_ART_SRC}
          alt=""
          width={282}
          height={190}
          unoptimized
          loading="eager"
          className="absolute top-0 left-[34px] h-[190px] w-[282px] object-contain"
        />
        {sparkles ? (
          <>
            <Sparkles size={20} className="absolute top-[30px] left-[285px]" />
            <Sparkle size={14} className="absolute top-[54px] left-[44px]" />
          </>
        ) : null}
      </div>

      <span className="absolute top-[54px] left-1/2 z-10 flex h-7 -translate-x-1/2 items-center gap-1.5 rounded-[14px] bg-surface px-2.5 text-brand">
        <BadgeIcon
          size={14}
          className={clsx(spinBadgeIcon && "animate-spin")}
          aria-hidden="true"
        />
        <span className="text-[10.5px] font-bold whitespace-nowrap">{badgeLabel}</span>
      </span>

      <h1
        className="absolute inset-x-5 top-[206px] text-center font-display leading-none font-bold"
        style={{ fontSize: headlineSize }}
      >
        {headline}
      </h1>
      <p className="absolute inset-x-[42px] top-[251px] text-center text-[12px] leading-4 text-white/80">
        {text}
      </p>
    </section>
  );
}
