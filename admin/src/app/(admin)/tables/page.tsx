import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Mesas · Café Central" };

export default function TablesPage() {
  return <ComingSoon moduleId="tables" />;
}
