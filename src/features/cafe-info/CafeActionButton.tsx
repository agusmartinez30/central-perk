import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type CafeActionButtonProps = {
  label: string;
  icon: LucideIcon;
  /** Destination; `null` renders the disabled (unavailable) button. */
  href: string | null;
  /** `primary`: filled brand button. `neutral`: white outlined button. */
  tone?: "primary" | "neutral";
  /** Opens in a new tab (maps, WhatsApp). */
  external?: boolean;
  className?: string;
};

const toneClasses = {
  primary: "bg-brand text-white outline-brand active:bg-brand-2",
  neutral: "bg-surface text-ink outline-line active:bg-cream",
  disabled: "bg-sand text-muted outline-line opacity-72 cursor-not-allowed",
};

/** 48px pill action of the business detail (maps and contact). */
export function CafeActionButton({
  label,
  icon: Icon,
  href,
  tone = "primary",
  external = false,
  className,
}: CafeActionButtonProps) {
  const classes = clsx(
    "flex h-12 items-center justify-center gap-[9px] rounded-3xl px-4 text-[13px] font-bold whitespace-nowrap outline-1 -outline-offset-[0.5px] outline-solid",
    toneClasses[href ? tone : "disabled"],
    className,
  );
  const content = (
    <>
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </>
  );

  if (!href) {
    return (
      <span role="link" aria-disabled="true" className={classes}>
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </a>
  );
}
