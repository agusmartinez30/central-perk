/** "Live Connection" pill of the top bar. */
export function ConnectionBadge() {
  return (
    <div
      role="status"
      className="flex h-8 items-center gap-[7px] rounded-[16px] bg-success-bg px-[11px]"
    >
      <span aria-hidden="true" className="size-[7px] rounded-full bg-success" />
      <span className="text-[11px] font-bold whitespace-nowrap text-success">En línea</span>
    </div>
  );
}
