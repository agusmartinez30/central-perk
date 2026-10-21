import { BatteryFull, Signal, Wifi } from "lucide-react";
import clsx from "clsx";

type StatusBarProps = {
  time?: string;
  /** `light`: ink on cream (default). `brand`: white on brand blue. */
  tone?: "light" | "brand";
  className?: string;
};

/** Decorative phone status bar shown at the top of every screen. */
export function StatusBar({ time = "9:41", tone = "light", className }: StatusBarProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "flex h-[54px] w-full shrink-0 items-center justify-between px-5",
        tone === "light" ? "bg-cream text-ink" : "bg-brand text-white",
        className,
      )}
    >
      <span className="font-clock text-[14px] font-bold">{time}</span>
      <span className="flex items-center gap-[7px]">
        <Signal size={16} strokeWidth={2.25} />
        <Wifi size={16} strokeWidth={2.25} />
        <BatteryFull size={20} strokeWidth={2} />
      </span>
    </div>
  );
}
