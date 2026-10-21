import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Moment } from "@/mocks/types";

type MomentCardProps = {
  moment: Moment;
  /** Eager-load images that are visible above the fold. */
  eager?: boolean;
};

/** Editorial consumption-moment card on the Explore landing. */
export function MomentCard({ moment, eager = false }: MomentCardProps) {
  return (
    <Link
      href={`/explore/${moment.id}`}
      className="flex h-[218px] min-w-0 flex-col overflow-hidden rounded-[20px] bg-surface transition-transform active:scale-[0.98]"
    >
      <div className="relative h-[142px] w-full shrink-0">
        <Image
          src={moment.image}
          alt=""
          fill
          sizes="171px"
          loading={eager ? "eager" : undefined}
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-ink/0 to-ink/24"
        />
      </div>
      <div className="flex flex-col gap-[3px] px-3 pt-[11px] pb-2.5">
        <h2 className="truncate text-[16px] font-bold text-ink">{moment.title}</h2>
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[11px] text-muted">{moment.subtitle}</p>
          <ArrowUpRight size={16} className="shrink-0 text-brand" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
