"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { ConnectionBadge } from "./ConnectionBadge";
import { StaffProfile } from "./StaffProfile";
import { getSectionTitle } from "./navigation";

type AdminTopbarProps = {
  staffName: string;
  staffRole: string;
};

/** White top bar ("AdminTopbar") with the section title, connection state and staff profile. */
export function AdminTopbar({ staffName, staffRole }: AdminTopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-line bg-surface px-7">
      <h1 className="text-[13px] font-semibold whitespace-nowrap text-ink">
        {getSectionTitle(pathname)}
      </h1>
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
    </header>
  );
}
