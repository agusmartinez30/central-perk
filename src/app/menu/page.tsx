import type { Metadata } from "next";
import { MenuScreen } from "@/features/menu";
import { SlideTransition } from "@/shared/ui";

export const metadata: Metadata = { title: "Menú · Café Central" };

export default function MenuPage() {
  return (
    <SlideTransition>
      <MenuScreen />
    </SlideTransition>
  );
}
