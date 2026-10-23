import clsx from "clsx";

export type FilterChipItem<Id extends string> = {
  id: Id;
  label: string;
};

type FilterChipsProps<Id extends string> = {
  items: readonly FilterChipItem<Id>[];
  selected: Id;
  onSelect: (id: Id) => void;
  label: string;
  /** Label weight: the menu uses bold, explore uses semibold. */
  weight?: "bold" | "semibold";
  className?: string;
};

/** Horizontally scrollable single-select chip row. */
export function FilterChips<Id extends string>({
  items,
  selected,
  onSelect,
  label,
  weight = "bold",
  className,
}: FilterChipsProps<Id>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={clsx("no-scrollbar -mx-4 flex gap-[7px] overflow-x-auto px-4", className)}
    >
      {items.map((item) => {
        const isSelected = item.id === selected;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onSelect(item.id)}
            className={clsx(
              "flex h-9 shrink-0 items-center justify-center rounded-[18px] px-[15px] text-[12px] whitespace-nowrap outline-1 -outline-offset-[0.5px] outline-solid transition-colors",
              weight === "bold" ? "font-bold" : "font-semibold",
              isSelected
                ? "bg-brand text-white outline-brand"
                : "bg-surface text-ink outline-line active:bg-brand-soft",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
