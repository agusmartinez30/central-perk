"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS, findActiveNavItem } from "./navigation";
import { SidebarNavItem } from "./SidebarNavItem";

/** Dark left navigation ("AdminSidebar" in the exports). */
export function AdminSidebar() {
  const pathname = usePathname();
  const activeId = findActiveNavItem(pathname)?.id;

  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col gap-[3px] overflow-y-auto bg-sidebar px-[18px] py-[22px]">
      <div className="flex flex-col gap-0.5 px-2 pb-[18px]">
        <p className="text-[14px] font-bold whitespace-nowrap text-white">CAFÉ CENTRAL</p>
        <p className="text-[9px] whitespace-nowrap text-white/60">Panel de operaciones</p>
      </div>
      <nav aria-label="Módulos" className="contents">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.id} item={item} active={item.id === activeId} />
        ))}
      </nav>
    </aside>
  );
}
