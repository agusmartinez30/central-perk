import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Configuración · Café Central" };

export default function SettingsPage() {
  return <ComingSoon moduleId="settings" />;
}
