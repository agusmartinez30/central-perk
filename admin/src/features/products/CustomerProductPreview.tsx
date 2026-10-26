"use client";

import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import {
  PREVIEW_QUANTITY_MAX,
  getPreviewAddLabel,
  getPreviewSelection,
  stepPreviewQuantity,
  togglePreviewOption,
  type PreviewSelection,
} from "./preview-order";
import type { PreviewModel } from "./product-form";
import { ProductImage } from "./ProductTags";

type CustomerProductPreviewProps = {
  preview: PreviewModel;
  available: boolean;
  /** Box size: 07B gives a 330px column that fills its height, 07C a fixed stage. */
  className?: string;
};

/**
 * "Refined Mobile Preview" (07B) / customer preview (07C): the product page of the customer app
 * inside a phone-like frame. Options and the quantity can be tried out; those choices stay in the
 * preview and never change the draft.
 */
export function CustomerProductPreview({ preview, available, className }: CustomerProductPreviewProps) {
  const [touched, setTouched] = useState<PreviewSelection>({});
  const [quantity, setQuantity] = useState(1);
  const selection = getPreviewSelection(preview, touched);

  return (
    <div
      aria-label={`Vista previa de ${preview.name} para clientes`}
      role="region"
      className={clsx(
        "flex flex-col items-center overflow-hidden rounded-[22px] bg-[#fbfaf7] outline-1 -outline-offset-[0.5px] outline-[#d4d0c8]",
        className,
      )}
    >
      <span aria-hidden="true" className="my-[7px] h-1 w-[70px] shrink-0 rounded-[2px] bg-[#d4d0c8]" />
      <ProductImage src={preview.image} alt={preview.name} sizes="330px" iconSize={32} className="h-[190px] w-full" />
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto px-3.5 py-3">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-[3px]">
            <p className="truncate text-[18px] font-bold text-ink">{preview.name}</p>
            {preview.description && <p className="line-clamp-2 text-[12px]/[15px] text-muted">{preview.description}</p>}
          </div>
          <p className="shrink-0 text-[14px] font-bold text-brand">{preview.price}</p>
        </div>
        <p
          className={clsx(
            "flex h-6 w-fit shrink-0 items-center gap-[5px] rounded-xl px-2",
            available ? "bg-success-bg text-success" : "bg-sand text-muted",
          )}
        >
          <span aria-hidden="true" className={clsx("size-[5px] rounded-full", available ? "bg-success" : "bg-muted")} />
          <span className="text-[11px] font-bold whitespace-nowrap">{available ? "Disponible ahora" : "No disponible"}</span>
        </p>
        {preview.groups.map((group) => {
          const picked = selection[group.id] ?? [];
          return (
            <div key={group.id} role="group" aria-label={group.title} className="flex w-full flex-col gap-[5px]">
              <div className="flex w-full items-start justify-between gap-2">
                <p className="truncate text-[12px] font-bold text-ink">{group.title}</p>
                <p className="shrink-0 text-[11px] text-muted">{group.meta}</p>
              </div>
              <div className="flex w-full flex-wrap gap-[5px]">
                {group.options.map((option) => {
                  const selected = picked.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setTouched((current) => ({
                          ...current,
                          [group.id]: togglePreviewOption(preview, selection, group.id, option.id)[group.id],
                        }))
                      }
                      className={clsx(
                        "flex h-7 min-w-0 flex-[1_1_auto] items-center justify-center rounded-[7px] px-2 outline-1 -outline-offset-[0.5px]",
                        selected ? "bg-brand-wash text-brand outline-brand" : "bg-surface text-muted outline-line hover:text-ink",
                      )}
                    >
                      <span className="truncate text-[11px] font-bold">{option.chipLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex h-[54px] w-full shrink-0 gap-2 border-t border-line bg-surface px-3 py-2">
        <div className="flex w-[76px] shrink-0 items-center justify-between rounded-nav bg-sand px-1">
          <button
            type="button"
            aria-label="Restar uno"
            disabled={quantity <= 1}
            onClick={() => setQuantity((current) => stepPreviewQuantity(current, -1))}
            className="flex size-6 items-center justify-center rounded-chip text-ink enabled:hover:bg-line/60 disabled:text-muted"
          >
            <Minus size={11} aria-hidden="true" />
          </button>
          <output aria-label="Cantidad" className="text-[12px] font-bold text-ink">
            {quantity}
          </output>
          <button
            type="button"
            aria-label="Sumar uno"
            disabled={quantity >= PREVIEW_QUANTITY_MAX}
            onClick={() => setQuantity((current) => stepPreviewQuantity(current, 1))}
            className="flex size-6 items-center justify-center rounded-chip text-ink enabled:hover:bg-line/60 disabled:text-muted"
          >
            <Plus size={11} aria-hidden="true" />
          </button>
        </div>
        <p
          className={clsx(
            "flex min-w-0 flex-1 items-center justify-center rounded-nav",
            available ? "bg-brand text-white" : "bg-line text-muted",
          )}
        >
          <span className="text-[12px] font-bold whitespace-nowrap">
            {available ? getPreviewAddLabel(preview, selection, quantity) : "No disponible"}
          </span>
        </p>
      </div>
    </div>
  );
}
