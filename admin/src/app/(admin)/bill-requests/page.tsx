import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Solicitudes de cuenta · Café Central" };

export default function BillRequestsPage() {
  return <ComingSoon moduleId="bill-requests" />;
}
