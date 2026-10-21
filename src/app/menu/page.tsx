import type { Metadata } from "next";
import { MenuScreen } from "@/features/menu";

export const metadata: Metadata = { title: "Menú · Café Central" };

export default function MenuPage() {
  return <MenuScreen />;
}
