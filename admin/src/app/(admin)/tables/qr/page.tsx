import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Mesas y códigos QR · Café Central" };

export default function TableQrPage() {
  return <ComingSoon moduleId="table-qr" />;
}
