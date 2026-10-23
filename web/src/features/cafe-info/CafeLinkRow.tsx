import { ArrowUpRight, Minus } from "lucide-react";
import clsx from "clsx";
import { CAFE_INFO_COPY, LINK_META } from "./cafe-info-copy";
import type { LinkRow } from "./cafe-info-view";

/**
 * 54px row of "También online": network icon, name, handle and an external-link action.
 * Without a link the row is dimmed, reads "No disponible" and has no action.
 */
export function CafeLinkRow({ network, handle, href }: LinkRow) {
  const { name, icon: Icon } = LINK_META[network];
  const available = href !== null;

  const content = (
    <>
      <span
        className={clsx(
          "flex size-[38px] shrink-0 items-center justify-center rounded-full",
          available ? "bg-brand-wash text-brand" : "bg-sand text-muted",
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={clsx("text-[11px] font-bold", available ? "text-ink" : "text-muted")}>{name}</span>
        <span className={clsx("truncate text-[12px]", available ? "text-brand" : "text-muted")}>
          {available ? handle : CAFE_INFO_COPY.unavailable}
        </span>
      </span>
      {available ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid">
          <ArrowUpRight size={15} aria-hidden="true" />
        </span>
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center text-muted">
          <Minus size={15} aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (!available) {
    return <div className="flex h-[54px] w-full items-center gap-3 opacity-58">{content}</div>;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex h-[54px] w-full items-center gap-3">
      {content}
    </a>
  );
}
