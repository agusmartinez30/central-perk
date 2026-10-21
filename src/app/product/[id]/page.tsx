import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, getProductById } from "@/mocks/menu";
import { ProductDetail } from "@/features/product";

/** Every product is known ahead of time, so all detail pages are prerendered. */
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
  const product = getProductById((await params).id);
  return { title: product ? `${product.name} · Café Central` : "Café Central" };
}

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
  const product = getProductById((await params).id);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
