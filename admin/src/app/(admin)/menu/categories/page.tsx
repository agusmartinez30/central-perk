import { Suspense } from "react";
import type { Metadata } from "next";
import { MenuOrganizationScreen } from "@/features/menu-organization";

export const metadata: Metadata = { title: "Categorías y momentos · Café Central" };

export default function CategoriesPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <MenuOrganizationScreen />
    </Suspense>
  );
}
