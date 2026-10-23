import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsScreen } from "@/features/products";

export const metadata: Metadata = { title: "Productos · Café Central" };

export default function ProductsPage() {
  return (
    // `?state=` is read on the client, so the screen needs a Suspense boundary.
    <Suspense fallback={null}>
      <ProductsScreen />
    </Suspense>
  );
}
