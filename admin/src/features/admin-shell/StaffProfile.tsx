type StaffProfileProps = {
  name: string;
  role: string;
};

/** Avatar plus name and role ("Staff Avatar" / "Staff Profile"). */
export function StaffProfile({ name, role }: StaffProfileProps) {
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
