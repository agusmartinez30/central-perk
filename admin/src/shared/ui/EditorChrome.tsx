import clsx from "clsx";
import { CircleAlert, Save } from "lucide-react";
import type { ReactNode } from "react";

/** "Pending Changes": 28px amber pill of an editor header (9px label → 11px). */
export function UnsavedBadge({ label }: { label: string }) {
  return (
    <p className="flex h-7 items-center gap-1.5 rounded-[14px] bg-warning-bg px-2.5 text-warning">
      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-warning" />
      <span className="text-[11px] font-bold whitespace-nowrap">{label}</span>
    </p>
  );
}

type HeaderSwitchProps = {
  /** Visible text beside the switch ("Visible"). */
  label: string;
  /** Accessible name of the switch. */
  ariaLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** "Visibility Control" / "Publication Control": 34px white box with a 30×18 switch. */
export function HeaderSwitch({ label, ariaLabel, checked, onChange }: HeaderSwitchProps) {
  return (
    <div className="flex h-[34px] items-center gap-2 rounded-field bg-surface px-2.5 outline-1 -outline-offset-[0.5px] outline-line">
      <span aria-hidden="true" className="text-[11px] font-bold whitespace-nowrap text-ink">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={clsx(
          "flex h-[18px] w-[30px] shrink-0 items-center rounded-[9px] p-0.5 transition-colors",
          checked ? "justify-end bg-brand" : "justify-start bg-line",
        )}
      >
        <span aria-hidden="true" className="size-3.5 rounded-full bg-surface" />
      </button>
    </div>
  );
}

type SaveBarProps = {
  title: string;
  hint: string;
  /** A save was stopped by validation errors: red title. */
  blocked?: boolean;
  /** Buttons on the right (`SaveBarButton`). */
  children: ReactNode;
};

/** "Neutral Save Bar" / "Persistent Save Bar": 58px white bar with the save status and its actions. */
export function SaveBar({ title, hint, blocked = false, children }: SaveBarProps) {
  return (
    <div className="flex h-[58px] w-full shrink-0 items-center justify-between rounded-tile bg-surface px-3.5 outline-1 -outline-offset-[0.5px] outline-line">
      <div role="status" className="flex items-center gap-[9px]">
        <CircleAlert size={15} aria-hidden="true" className={clsx("shrink-0", blocked ? "text-danger" : "text-warning")} />
        <div className="flex flex-col gap-px">
          <p className={clsx("text-[12px] font-bold whitespace-nowrap", blocked ? "text-danger" : "text-ink")}>{title}</p>
          <p className="text-[11px] whitespace-nowrap text-muted">{hint}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

type SaveBarButtonProps = { label: string; tone: "primary" | "quiet"; onClick: () => void };

/** "Discard" (quiet text button) and "Save Primary" (brand, with the save icon), 36px, 9px labels → 12px. */
export function SaveBarButton({ label, tone, onClick }: SaveBarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex h-9 items-center gap-1.5 rounded-nav text-[12px] font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        tone === "primary" ? "bg-brand px-[15px] text-white hover:bg-brand/92" : "px-3 text-muted hover:bg-cream hover:text-ink",
      )}
    >
      {tone === "primary" && <Save size={13} aria-hidden="true" />}
      {label}
    </button>
  );
}
