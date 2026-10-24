import { Suspense } from "react";
import type { Metadata } from "next";
import { TableManagementScreen } from "@/features/table-management";

export const metadata: Metadata = { title: "Gestión de mesas · Café Central" };

export default function TableManagementPage() {
  return (
    // `?state=`, `?table=` and `?space=` are read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <TableManagementScreen />
    </Suspense>
  );
}
