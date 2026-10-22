import { ArrowUpRight } from "lucide-react";
import { LINK_META } from "./cafe-info-copy";
import type { LinkRow } from "./cafe-info-view";

/** 54px row of "También online": network icon, name, handle and an external-link action. */
export function CafeLinkRow({ network, handle, href }: LinkRow) {
  const { name, icon: Icon } = LINK_META[network];

  return (
    <a
      href={href ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-[54px] w-full items-center gap-3"
    >
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-bold text-ink">{name}</span>
        <span className="truncate text-[12px] text-brand">{handle}</span>
      </span>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid">
        <ArrowUpRight size={15} aria-hidden="true" />
      </span>
    </a>
  );
}
