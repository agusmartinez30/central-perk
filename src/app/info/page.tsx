import type { Metadata } from "next";
import { CafeInfoScreen } from "@/features/cafe-info";

export const metadata: Metadata = { title: "Información · Café Central" };

export default function InfoPage() {
  return <CafeInfoScreen />;
}
