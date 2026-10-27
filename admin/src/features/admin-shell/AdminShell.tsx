import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

type AdminShellProps = {
  children: ReactNode;
};

/** Authenticated back-office frame: sidebar, top bar and the scrolling main area. */
export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        {/* Each screen owns its padding: the exports use different gutters per module. */}
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
