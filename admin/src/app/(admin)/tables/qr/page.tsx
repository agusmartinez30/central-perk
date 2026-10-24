import { Suspense } from "react";
import type { Metadata } from "next";
import { TableQrScreen } from "@/features/table-qr";

export const metadata: Metadata = { title: "Mesas y códigos QR · Café Central" };

export default function TableQrPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <TableQrScreen />
    </Suspense>
  );
}
