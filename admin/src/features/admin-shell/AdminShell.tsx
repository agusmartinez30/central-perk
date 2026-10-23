import type { ReactNode } from "react";
import { DEMO_STAFF } from "@/mocks/staff";
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
        <AdminTopbar staffName={DEMO_STAFF.name} staffRole={DEMO_STAFF.role} />
        <main className="flex flex-1 flex-col px-6 py-3.5">{children}</main>
      </div>
    </div>
  );
}
