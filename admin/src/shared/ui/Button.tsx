import type { ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import clsx from "clsx";

type ButtonVariant = "primary" | "text";

export type ButtonProps = {
  children: ReactNode;
  /** Optional lucide icon rendered before the label. */
  icon?: LucideIcon;
  /** Renders a next/link when provided (ignored while disabled or loading). */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "h-12 rounded-field bg-brand text-[14px] text-white hover:bg-brand/92 disabled:bg-brand/50",
  text: "h-11 text-[12px] text-brand hover:underline disabled:text-muted",
};

function BaseButton({
  variant,
  children,
  icon: Icon,
  href,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  className,
}: ButtonProps & { variant: ButtonVariant }) {
  const inactive = disabled || loading;
  const classes = clsx(
    "inline-flex w-full shrink-0 items-center justify-center gap-2 font-bold whitespace-nowrap transition-colors select-none",
    variantClasses[variant],
    inactive && "cursor-not-allowed",
    className,
  );
  const content = (
    <>
      {loading ? (
        <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={16} aria-hidden="true" />
      )}
      <span>{children}</span>
    </>
  );

  if (href && !inactive) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={inactive}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  );
}

/** Solid brand button ("Login Button", "Verify Button"…). */
export function PrimaryButton(props: ButtonProps) {
  return <BaseButton variant="primary" {...props} />;
}

/** Borderless brand link-button ("Back to Login", "Recovery Method"). */
export function TextButton(props: ButtonProps) {
  return <BaseButton variant="text" {...props} />;
}
