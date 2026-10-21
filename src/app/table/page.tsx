import { Suspense } from "react";
import type { Metadata } from "next";
import { TableScreen } from "@/features/table";
import { StatusBar } from "@/shared/ui";

export const metadata: Metadata = { title: "Mi mesa · Café Central" };

export default function TablePage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={<StatusBar />}>
      <TableScreen />
    </Suspense>
  );
}
