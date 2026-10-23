"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { ConnectionBadge } from "./ConnectionBadge";
import { StaffProfile } from "./StaffProfile";
import { getTopbarConfig } from "./navigation";

type AdminTopbarProps = {
  staffName: string;
  staffRole: string;
};

/** Round "Notifications" button with the "Unread Dot" of the 02 top bar. */
function NotificationsButton() {
  return (
    <button
      type="button"
      aria-label="Notificaciones (sin leer)"
      className="relative size-10 shrink-0 rounded-full bg-cream text-ink"
    >
      <Bell size={18} aria-hidden="true" className="absolute top-[11px] left-[11px]" />
      <span
        aria-hidden="true"
        className="absolute top-[7px] left-[26px] size-2 rounded-full bg-danger outline-2 -outline-offset-1 outline-white"
      />
    </button>
  );
}

/**
 * White top bar ("AdminTopbar" / "Topbar · Desktop"). Modules pick the layout of their
 * export through `NavItem.topbar`: the 10A section title or the 02 branch and shift.
 */
export function AdminTopbar({ staffName, staffRole }: AdminTopbarProps) {
  const pathname = usePathname();
  const { variant, title } = getTopbarConfig(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-line bg-surface px-7">
      <h1 className="text-[13px] font-semibold whitespace-nowrap text-ink">{title}</h1>
      {variant === "location" ? (
        <div className="flex items-center gap-[18px]">
          <NotificationsButton />
          <StaffProfile name={staffName} role={staffRole} />
        </div>
      ) : (
        <div className="flex items-center gap-3.5">
          <ConnectionBadge />
          <button
            type="button"
            aria-label="Notificaciones"
            className="flex size-[18px] items-center justify-center text-ink"
          >
            <Bell size={18} aria-hidden="true" />
          </button>
          <StaffProfile name={staffName} role={staffRole} />
        </div>
      )}
    </header>
  );
}
