/** "Live Connection" pill of the top bar. */
export function ConnectionBadge() {
  return (
    <div
      role="status"
      className="flex h-[30px] items-center gap-1.5 rounded-[15px] bg-success-bg px-2.5"
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
      <span className="text-[9px] font-bold whitespace-nowrap text-success">En línea</span>
    </div>
  );
}
