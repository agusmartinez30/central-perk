import type { Metadata } from "next";
import { CafeInfoScreen } from "@/features/cafe-info";

export const metadata: Metadata = { title: "Detalle del negocio · Café Central" };

export default function InfoPage() {
  return <CafeInfoScreen />;
}
