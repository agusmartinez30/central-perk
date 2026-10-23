import type { Metadata } from "next";
import { OverviewScreen } from "@/features/overview";

export const metadata: Metadata = { title: "Resumen general · Café Central" };

export default function OverviewPage() {
  return <OverviewScreen />;
}
