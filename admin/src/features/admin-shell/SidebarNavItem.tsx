import Link from "next/link";
import clsx from "clsx";
import type { NavItem } from "./navigation";

type SidebarNavItemProps = {
  item: NavItem;
  active: boolean;
};

export function SidebarNavItem({ item, active }: SidebarNavItemProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-[35px] w-full shrink-0 items-center gap-[9px] rounded-nav px-2.5 text-[9px] whitespace-nowrap transition-colors",
        active
          ? "bg-brand font-bold text-white"
          : "font-medium text-white/72 hover:bg-white/6 hover:text-white",
      )}
    >
      <Icon
        size={14}
        aria-hidden="true"
        className={clsx("shrink-0", active ? "text-white" : "text-white/60")}
      />
      <span>{item.label}</span>
    </Link>
  );
}
