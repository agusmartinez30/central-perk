import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Productos · Café Central" };

export default function ProductsPage() {
  return <ComingSoon moduleId="products" />;
}
