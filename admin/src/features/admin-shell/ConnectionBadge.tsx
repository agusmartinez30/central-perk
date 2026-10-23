import clsx from "clsx";

type ConnectionBadgeProps = {
  /** `online`: 10A "Live Connection" pill. `live`: 03 "Connection Status" pill. */
  variant?: "online" | "live";
};

/** Green connection pill of the top bar. */
export function ConnectionBadge({ variant = "online" }: ConnectionBadgeProps) {
  return (
    <div
      role="status"
      className={clsx(
        "flex h-8 items-center gap-[7px] bg-success-bg px-[11px]",
        variant === "live" ? "rounded-nav" : "rounded-[16px]",
      )}
    >
      <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
      <span className="text-[11px] font-bold whitespace-nowrap text-success">
        {variant === "live" ? "En vivo" : "En línea"}
      </span>
    </div>
  );
}
