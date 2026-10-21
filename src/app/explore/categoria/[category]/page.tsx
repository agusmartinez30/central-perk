import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/mocks/menu";
import { CategoryResults, getCategoryById } from "@/features/explore";

/** Every menu category is known ahead of time, so all category pages are prerendered. */
export function generateStaticParams() {
  return CATEGORIES.filter((category) => category.id !== "todos").map((category) => ({
    category: category.id,
  }));
}

export async function generateMetadata({
  params,
}: PageProps<"/explore/categoria/[category]">): Promise<Metadata> {
  const category = getCategoryById((await params).category);
  return { title: category ? `${category.label} · Café Central` : "Café Central" };
}

export default async function ExploreCategoryPage({
  params,
}: PageProps<"/explore/categoria/[category]">) {
  const category = getCategoryById((await params).category);
  if (!category) notFound();
  return <CategoryResults category={category} />;
}
