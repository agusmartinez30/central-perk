import { BatteryFull, Signal, Wifi } from "lucide-react";
import clsx from "clsx";

type StatusBarProps = {
  time?: string;
  className?: string;
};

/** Decorative phone status bar shown at the top of every screen. */
export function StatusBar({ time = "9:41", className }: StatusBarProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "flex h-[54px] w-full shrink-0 items-center justify-between bg-cream px-5",
        className,
      )}
    >
      <span className="font-clock text-[14px] font-bold text-ink">{time}</span>
      <span className="flex items-center gap-[7px] text-ink">
        <Signal size={16} strokeWidth={2.25} />
        <Wifi size={16} strokeWidth={2.25} />
        <BatteryFull size={20} strokeWidth={2} />
      </span>
    </div>
  );
}
