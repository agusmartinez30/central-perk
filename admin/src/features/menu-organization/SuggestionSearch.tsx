import { Search } from "lucide-react";
import { useId } from "react";

type Suggestion = { id: string; label: string; meta?: string };

type SuggestionSearchProps = {
  label: string;
  placeholder: string;
  value: string;
  suggestions: Suggestion[];
  /** Shown when the query has no match (invented copy). */
  emptyLabel: string;
  onChange: (value: string) => void;
  onPick: (id: string) => void;
};

/**
 * "Category Search" / "Product Search": 36px cream field with a search icon (10px text → 12px).
 * Typing lists the matches that can still be associated; picking one adds it and clears the box.
 */
export function SuggestionSearch({ label, placeholder, value, suggestions, emptyLabel, onChange, onPick }: SuggestionSearchProps) {
  const listId = useId();
  const open = value.trim().length > 0;
  return (
    <div className="relative w-full shrink-0">
      <label className="flex h-9 w-full items-center gap-2 rounded-nav bg-cream px-2.5 focus-within:outline-2 focus-within:outline-brand">
        <Search size={14} aria-hidden="true" className="shrink-0 text-muted" />
        <span className="sr-only">{label}</span>
        <input
          type="search"
          role="combobox"
          aria-autocomplete="list"
          value={value}
          placeholder={placeholder}
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onChange("");
            if (event.key === "Enter" && suggestions[0]) {
              event.preventDefault();
              onPick(suggestions[0].id);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none placeholder:text-muted"
        />
      </label>
      {open && (
        <ul
          id={listId}
          aria-label={`Resultados de ${label.toLowerCase()}`}
          className="absolute top-10 right-0 left-0 z-20 max-h-48 overflow-y-auto rounded-nav bg-surface py-1 shadow-modal outline-1 -outline-offset-[0.5px] outline-line"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                onClick={() => onPick(suggestion.id)}
                className="flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-[12px] text-ink hover:bg-cream"
              >
                <span className="truncate font-semibold">{suggestion.label}</span>
                <span className="shrink-0 text-[11px] font-semibold text-brand">{suggestion.meta ?? "Agregar"}</span>
              </button>
            </li>
          ))}
          {suggestions.length === 0 && <li className="px-2.5 py-2 text-[12px] text-muted">{emptyLabel}</li>}
        </ul>
      )}
    </div>
  );
}
