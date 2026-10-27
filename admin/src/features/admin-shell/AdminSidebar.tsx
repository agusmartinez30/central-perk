"use client";

import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";
import { NAV_ITEMS, findActiveNavItem } from "./navigation";
import { SidebarNavItem } from "./SidebarNavItem";

/** Dark left navigation ("AdminSidebar" in the exports). */
export function AdminSidebar() {
  const pathname = usePathname();
  const activeId = findActiveNavItem(pathname)?.id;

  return (
    <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col gap-1 overflow-y-auto bg-sidebar px-3.5 py-[22px]">
      <div className="flex flex-col gap-0.5 px-2.5 pb-[18px]">
        <p className="text-[17px] font-bold tracking-[1.5px] whitespace-nowrap text-white">CAFÉ CENTRAL</p>
        <p className="text-[12px] whitespace-nowrap text-white/60">Panel de operaciones</p>
      </div>
      <nav aria-label="Módulos" className="contents">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem key={item.id} item={item} active={item.id === activeId} />
        ))}
      </nav>
      <LogoutButton />
    </aside>
  );
}
