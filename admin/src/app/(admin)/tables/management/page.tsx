import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Gestión de mesas · Café Central" };

export default function TableManagementPage() {
  return <ComingSoon moduleId="table-management" />;
}
