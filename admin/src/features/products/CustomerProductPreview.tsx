import clsx from "clsx";
import type { PreviewModel } from "./product-form";
import { ProductImage } from "./ProductTags";

type CustomerProductPreviewProps = {
  preview: PreviewModel;
  available: boolean;
  /** Box size: the 07B column fills its height, the 07C stage uses 400×690. */
  className?: string;
};

/**
 * "Live Product Preview" (07B) / "Standalone Customer Product Preview" (07C): the product page
 * of the customer app inside a phone-like frame. Read only: nothing in it reacts to clicks.
 */
export function CustomerProductPreview({ preview, available, className }: CustomerProductPreviewProps) {
  return (
    <div
      aria-label={`Vista previa de ${preview.name} para clientes`}
      role="region"
      className={clsx(
        "flex flex-col gap-2.5 overflow-hidden rounded-[20px] bg-cream px-4 pt-[18px] pb-4 outline-[5px] -outline-offset-[2.5px] outline-ink",
        className,
      )}
    >
      <p className="text-[10px] font-bold text-ink">CAFÉ CENTRAL</p>
      <ProductImage
        src={preview.image}
        alt={preview.name}
        sizes="368px"
        iconSize={32}
        className="h-[210px] w-full rounded-[14px]"
      />
      <p className="truncate text-[22px] font-bold text-ink">{preview.name}</p>
      {preview.description && <p className="line-clamp-2 w-full text-[12px] text-muted">{preview.description}</p>}
      <p className="text-[16px] font-bold text-brand">{preview.price}</p>
      {preview.sizes.length > 0 && (
        <>
          <p className="text-[12px] font-bold text-ink">Elegí el tamaño</p>
          <div className="flex w-full gap-1.5">
            {preview.sizes.map((size) => (
              <span
                key={size.id}
                className={clsx(
                  "flex h-[34px] min-w-0 flex-1 items-center justify-center rounded-nav px-1 outline-1 -outline-offset-[0.5px]",
                  size.selected ? "bg-brand text-white outline-brand" : "bg-surface text-ink outline-line",
                )}
              >
                <span className="truncate text-[11px] font-bold">{size.name}</span>
              </span>
            ))}
          </div>
        </>
      )}
      {preview.extras.length > 0 && (
        <>
          <p className="text-[12px] font-bold text-ink">Extras</p>
          <ul className="flex w-full flex-col gap-[5px]">
            {preview.extras.map((extra) => (
              <li
                key={extra.id}
                className="flex h-[30px] items-center rounded-[7px] bg-surface px-2 outline-1 -outline-offset-[0.5px] outline-line"
              >
                <span className="truncate text-[11px] font-semibold text-ink">{extra.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <span aria-hidden="true" className="min-h-0 flex-1" />
      <p
        className={clsx(
          "flex h-[42px] w-full shrink-0 items-center justify-center rounded-[10px]",
          available ? "bg-brand text-white" : "bg-line text-muted",
        )}
      >
        <span className="text-[13px] font-bold whitespace-nowrap">{available ? preview.addLabel : "No disponible"}</span>
      </p>
    </div>
  );
}
