import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Pagos · Café Central" };

export default function PaymentsPage() {
  return <ComingSoon moduleId="payments" />;
}
