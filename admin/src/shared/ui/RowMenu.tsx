"use client";

import clsx from "clsx";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type RowMenuItem = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Shown but inert (`aria-disabled`), so it stays reachable with the arrow keys. */
  disabled?: boolean;
};

type RowMenuProps = {
  /** Accessible name of the trigger, e.g. "Más acciones para Cappuccino". */
  label: string;
  items: readonly RowMenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MENU_WIDTH = 168;
const GAP = 4;
const ITEM_HEIGHT = 32;
const MENU_PADDING = 4;

/**
 * "More Actions": 30px trigger with a menu of secondary actions (07 table rows, 08A cards). The menu is fixed to the
 * viewport, so the scrolling table never clips it, and opens upwards near the bottom edge.
 * Keyboard: Enter/Space/ArrowDown open it on the first item, arrows and Home/End move, Escape
 * and Tab close it, and focus returns to the trigger.
 */
export function RowMenu({ label, items, open, onOpenChange }: RowMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // Placed when opening, from the trigger; the item height is fixed, so the menu height is known.
  const openMenu = () => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (trigger) {
      const height = items.length * ITEM_HEIGHT + 2 * MENU_PADDING;
      const below = trigger.bottom + GAP;
      const top = below + height > window.innerHeight ? trigger.top - GAP - height : below;
      setPosition({ top, left: Math.max(8, trigger.right - MENU_WIDTH) });
    }
    onOpenChange(true);
  };

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      const target = event.target as Node | null;
      if (target && (menuRef.current?.contains(target) || triggerRef.current?.contains(target))) return;
      onOpenChange(false);
    };
    const closeOnViewportChange = () => onOpenChange(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open, onOpenChange]);

  const closeAndFocusTrigger = () => {
    onOpenChange(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const options = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    const focusAt = (next: number) => options[(next + options.length) % options.length]?.focus();
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        closeAndFocusTrigger();
        break;
      case "Tab":
        onOpenChange(false);
        break;
      case "ArrowDown":
        event.preventDefault();
        focusAt(index + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAt(0);
        break;
      case "End":
        event.preventDefault();
        focusAt(options.length - 1);
        break;
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? onOpenChange(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            openMenu();
          }
        }}
        className={clsx(
          "flex size-[30px] shrink-0 items-center justify-center rounded-nav text-ink hover:bg-cream focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-brand",
          open ? "outline-2 -outline-offset-1 outline-brand" : "outline-1 -outline-offset-[0.5px] outline-line",
        )}
      >
        <Ellipsis size={14} aria-hidden="true" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          style={{ top: position?.top ?? 0, left: position?.left ?? 0, width: MENU_WIDTH }}
          className={clsx(
            "fixed z-20 flex flex-col rounded-nav bg-surface p-1 shadow-modal outline-1 -outline-offset-[0.5px] outline-line",
            !position && "invisible",
          )}
        >
          {items.map(({ label: itemLabel, icon: Icon, onSelect, disabled = false }) => (
            <button
              key={itemLabel}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={disabled || undefined}
              onClick={() => {
                if (disabled) return;
                closeAndFocusTrigger();
                onSelect();
              }}
              className={clsx(
                "flex h-8 items-center gap-2 rounded-[6px] px-2.5 text-left text-[12px] font-semibold outline-none",
                disabled
                  ? "cursor-not-allowed text-muted opacity-60 focus:bg-cream"
                  : "text-ink hover:bg-cream focus:bg-brand-wash focus:text-brand",
              )}
            >
              <Icon size={13} aria-hidden="true" className="shrink-0" />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
