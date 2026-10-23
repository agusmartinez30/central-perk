import { Suspense } from "react";
import type { Metadata } from "next";
import { TablesScreen } from "@/features/tables";

export const metadata: Metadata = { title: "Gestión de mesas · Café Central" };

export default function TablesPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <TablesScreen />
    </Suspense>
  );
}
