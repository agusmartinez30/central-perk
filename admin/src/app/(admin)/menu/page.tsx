import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Carta digital · Café Central" };

export default function MenuPage() {
  return <ComingSoon moduleId="menu" />;
}
