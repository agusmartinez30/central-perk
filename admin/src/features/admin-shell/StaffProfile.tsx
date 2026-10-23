type StaffProfileProps = {
  name: string;
  role: string;
};

/** Avatar plus name and role ("Staff Avatar" / "Staff Profile"), 02/03 scale: 34px avatar, 13/11px copy. */
export function StaffProfile({ name, role }: StaffProfileProps) {
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
