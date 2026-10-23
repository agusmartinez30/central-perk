"use client";

import { usePathname } from "next/navigation";
import { Bell, ShieldCheck } from "lucide-react";
import { ConnectionBadge } from "./ConnectionBadge";
import { StaffProfile } from "./StaffProfile";
import { getTopbarConfig } from "./navigation";

type AdminTopbarProps = {
  staffName: string;
  staffRole: string;
};

/**
 * Round "Notifications" button with the unread dot of the 02 (8px, outlined) or 03 (7px) top bar,
 * or without a dot and with the 17px bell of 05.
 */
function NotificationsButton({ dot = "outlined" }: { dot?: "outlined" | "small" | "none" }) {
  if (dot === "none") {
    return (
      <button
        type="button"
        aria-label="Notificaciones"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-ink"
      >
        <Bell size={17} aria-hidden="true" />
      </button>
    );
  }
  const smallDot = dot === "small";
  return (
    <button
      type="button"
      aria-label="Notificaciones (sin leer)"
      className="relative size-10 shrink-0 rounded-full bg-cream text-ink"
    >
      <Bell size={18} aria-hidden="true" className="absolute top-[11px] left-[11px]" />
      <span
        aria-hidden="true"
        className={
          smallDot
            ? "absolute top-2 left-[25px] size-[7px] rounded-full bg-danger"
            : "absolute top-[7px] left-[26px] size-2 rounded-full bg-danger outline-2 -outline-offset-1 outline-white"
        }
      />
    </button>
  );
}

/**
 * White top bar ("AdminTopbar" / "Topbar · Desktop"). Modules pick the layout of their
 * export through `NavItem.topbar`: the 10A section title, the 02 branch and shift, the 03
 * branch and shift with the "En vivo" pill (or 05 "Datos verificados"), the 06 branch with the
 * "Administrador" pill, or the 07 "Carta digital" title with the "Sincronizado" pill.
 */
export function AdminTopbar({ staffName, staffRole }: AdminTopbarProps) {
  const pathname = usePathname();
  const { variant, title } = getTopbarConfig(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center justify-between border-b border-line bg-surface px-7">
      <h1 className="text-[13px] font-semibold whitespace-nowrap text-ink">{title}</h1>
      {variant === "location" && (
        <div className="flex items-center gap-[18px]">
          <NotificationsButton />
          <StaffProfile name={staffName} role={staffRole} />
        </div>
      )}
      {variant === "live-location" && (
        <div className="flex items-center gap-4">
          <ConnectionBadge variant="live" />
          <NotificationsButton dot="small" />
          <StaffProfile name={staffName} role={staffRole} compact />
        </div>
      )}
      {variant === "verified-location" && (
        <div className="flex items-center gap-4">
          <ConnectionBadge variant="verified" />
          <NotificationsButton dot="none" />
          <StaffProfile name={staffName} role={staffRole} compact />
        </div>
      )}
      {variant === "catalog" && (
        <div className="flex items-center gap-4">
          <ConnectionBadge variant="synced" />
          <NotificationsButton dot="none" />
          <StaffProfile name={staffName} role={staffRole} compact />
        </div>
      )}
      {variant === "admin-location" && (
        <div className="flex items-center gap-4">
          <p className="flex h-8 items-center gap-[7px] rounded-nav bg-brand-wash px-[11px] text-brand">
            <ShieldCheck size={13} aria-hidden="true" className="shrink-0" />
            <span className="text-[11px] font-bold whitespace-nowrap">Administrador</span>
          </p>
          <NotificationsButton dot="none" />
          <StaffProfile name={staffName} role={staffRole} compact />
        </div>
      )}
      {variant === "section" && (
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
