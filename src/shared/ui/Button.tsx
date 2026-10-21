import type { ReactNode } from "react";
import Link from "next/link";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "lg" | "md";

export type ButtonProps = {
  children: ReactNode;
  /** Optional lucide icon rendered next to the label. */
  icon?: LucideIcon;
  iconPosition?: "start" | "end";
  size?: ButtonSize;
  /** Renders a next/link when provided (ignored while disabled or loading). */
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const sizeClasses: Record<ButtonSize, string> = {
  lg: "h-14 rounded-[28px] gap-2.5 px-6 text-[16px]",
  md: "h-12 rounded-3xl gap-[7px] px-4 text-[12.5px]",
};

const iconSizes: Record<ButtonSize, number> = { lg: 20, md: 17 };

function variantClasses(variant: ButtonVariant, inactive: boolean) {
  if (variant === "primary") {
    return inactive ? "bg-disabled text-white" : "bg-brand text-white active:bg-brand-2";
  }
  return clsx(
    "bg-surface outline-[1.5px] -outline-offset-[0.75px] outline-solid",
    inactive ? "text-faint outline-line" : "text-brand outline-brand active:bg-brand-soft",
  );
}

function BaseButton({
  variant,
  children,
  icon: Icon,
  iconPosition = "start",
  size = "lg",
  href,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = true,
  className,
}: ButtonProps & { variant: ButtonVariant }) {
  const inactive = disabled || loading;
  const classes = clsx(
    "inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap transition-colors select-none",
    sizeClasses[size],
    variantClasses(variant, disabled),
    fullWidth && "w-full",
    inactive && "cursor-not-allowed",
    className,
  );
  const iconSize = iconSizes[size];
  const leading = loading ? (
    <LoaderCircle size={iconSize} className="animate-spin" aria-hidden="true" />
  ) : Icon && iconPosition === "start" ? (
    <Icon size={iconSize} aria-hidden="true" />
  ) : null;
  const trailing =
    !loading && Icon && iconPosition === "end" ? <Icon size={iconSize} aria-hidden="true" /> : null;
  const content = (
    <>
      {leading}
      <span>{children}</span>
      {trailing}
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

export function PrimaryButton(props: ButtonProps) {
  return <BaseButton variant="primary" {...props} />;
}

export function SecondaryButton(props: ButtonProps) {
  return <BaseButton variant="secondary" {...props} />;
}
