import { AdminShell } from "@/features/admin-shell";
import { AuthGuard } from "@/features/auth";

export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
