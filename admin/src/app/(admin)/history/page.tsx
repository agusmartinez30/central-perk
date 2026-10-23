import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Historial · Café Central" };

export default function HistoryPage() {
  return <ComingSoon moduleId="history" />;
}
