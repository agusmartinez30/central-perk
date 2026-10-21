import { Check } from "lucide-react";
import clsx from "clsx";
import type { OptionGroup, Product } from "@/mocks/types";
import { formatChoicePrice } from "./product-options";

type OptionGroupFieldProps = {
  product: Product;
  group: OptionGroup;
  selected: readonly string[];
  onToggle: (choiceId: string) => void;
  /** Highlights the group when a required selection is missing. */
  invalid?: boolean;
};

/**
 * One customization group: radio rows for single-selection groups, checkbox rows for
 * multiple-selection groups, with the OBLIGATORIO / OPCIONAL tag.
 */
export function OptionGroupField({ product, group, selected, onToggle, invalid }: OptionGroupFieldProps) {
  const isSingle = group.selection === "single";
  const titleId = `group-${group.id}`;

  return (
    <fieldset className="flex w-full flex-col gap-2" aria-labelledby={titleId}>
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-[16px] font-bold text-ink">
          {group.title}
        </h2>
        <span
          className={clsx(
            "text-[9px] font-bold tracking-[1px]",
            invalid ? "text-danger" : group.required ? "text-brand" : "text-muted",
          )}
        >
          {group.required ? "OBLIGATORIO" : "OPCIONAL"}
        </span>
      </div>

      {group.choices.map((choice) => {
        const checked = selected.includes(choice.id);
        return (
          <label
            key={choice.id}
            className={clsx(
              "flex h-12 w-full cursor-pointer items-center justify-between rounded-xl px-3 outline-solid has-focus-visible:ring-2 has-focus-visible:ring-brand/40",
              checked
                ? "bg-brand-soft outline-2 -outline-offset-1 outline-brand"
                : "bg-surface outline-1 -outline-offset-[0.5px] outline-line",
            )}
          >
            <span className="flex flex-col gap-px">
              <span className="text-[13px] font-semibold text-ink">{choice.label}</span>
              <span className="text-[10px] text-muted">
                {formatChoicePrice(product, group, choice)}
              </span>
            </span>
            <input
              type={isSingle ? "radio" : "checkbox"}
              name={group.id}
              value={choice.id}
              checked={checked}
              onChange={() => onToggle(choice.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={clsx(
                "flex size-5 shrink-0 items-center justify-center outline-2 -outline-offset-1 outline-solid",
                isSingle ? "rounded-full" : "rounded-md",
                checked ? "bg-brand outline-brand text-white" : "bg-surface outline-line",
              )}
            >
              {checked && !isSingle ? <Check size={14} strokeWidth={3} /> : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
