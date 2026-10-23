type StaffProfileProps = {
  name: string;
  role: string;
  /** `compact`: 10A (32px avatar, 9px copy). `large`: 02 (34px avatar, 13/11px copy). */
  size?: "compact" | "large";
};

/** Avatar plus name and role ("Staff Avatar" / "Staff Profile"). */
export function StaffProfile({ name, role, size = "compact" }: StaffProfileProps) {
  if (size === "large") {
    return (
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="size-[34px] shrink-0 rounded-full bg-brand" />
        <div className="flex flex-col gap-px whitespace-nowrap">
          <p className="text-[13px] font-bold text-ink">{name}</p>
          <p className="text-[11px] text-muted">{role}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3.5">
      <span aria-hidden="true" className="size-8 shrink-0 rounded-full bg-brand" />
      <p className="text-[9px]/[11px] font-semibold whitespace-nowrap text-ink">
        {name}
        <br />
        {role}
      </p>
    </div>
  );
}
