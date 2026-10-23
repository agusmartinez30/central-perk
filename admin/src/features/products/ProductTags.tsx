import clsx from "clsx";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { ProductStatus } from "./product-catalog";

const STATUS_TONES: Record<ProductStatus, { chip: string; dot: string }> = {
  published: { chip: "bg-success-bg text-success", dot: "bg-success" },
  draft: { chip: "bg-sand text-muted", dot: "bg-muted" },
  archived: { chip: "bg-warning-bg text-warning", dot: "bg-warning" },
};

/** "Row Publication Status" / "Editor Publication Status" chip. Only "Publicado" is in the exports. */
export function PublicationStatus({ status, label }: { status: ProductStatus; label: string }) {
  const tone = STATUS_TONES[status];
  return (
    <span className={clsx("inline-flex h-[26px] items-center gap-1.5 rounded-[13px] px-[9px]", tone.chip)}>
      <span aria-hidden="true" className={clsx("size-1.5 shrink-0 rounded-full", tone.dot)} />
      <span className="text-[11px] font-bold whitespace-nowrap">{label}</span>
    </span>
  );
}

type AvailabilitySwitchProps = {
  available: boolean;
  /** Accessible name, e.g. "Disponibilidad de Cappuccino". */
  label: string;
  disabled?: boolean;
  onChange: (available: boolean) => void;
};

/** "Availability Control" + "Availability Label": 38×22 switch, brand when on. */
export function AvailabilitySwitch({ available, label, disabled = false, onChange }: AvailabilitySwitchProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={available}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!available)}
        className={clsx(
          "flex h-[22px] w-[38px] shrink-0 items-center rounded-[11px] p-[3px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          available ? "justify-end bg-brand" : "justify-start bg-line",
        )}
      >
        <span aria-hidden="true" className="size-4 rounded-full bg-surface" />
      </button>
      <span aria-hidden="true" className="text-[11px] font-bold whitespace-nowrap text-ink">
        {available ? "Disponible" : "No disponible"}
      </span>
    </span>
  );
}

type ProductImageProps = {
  src?: string;
  alt: string;
  /** Rendered size in px, used to pick the image width. */
  sizes: string;
  className?: string;
  /** Larger placeholder icon for the editor and the previews. */
  iconSize?: number;
};

/**
 * Product photo filling its box ("Product Thumbnail", "Editor Product Image", "Preview Product
 * Image"), or a neutral placeholder when the product has none.
 */
export function ProductImage({ src, alt, sizes, className, iconSize = 16 }: ProductImageProps) {
  return (
    <span className={clsx("relative block shrink-0 overflow-hidden bg-sand", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized={src.startsWith("blob:")} className="object-cover" />
      ) : (
        <span role="img" aria-label={`${alt} (sin imagen)`} className="flex size-full items-center justify-center text-muted">
          <ImageOff size={iconSize} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
