import type { Metadata } from "next";
import { ComingSoon } from "@/features/admin-shell";

export const metadata: Metadata = { title: "Categorías y momentos · Café Central" };

export default function CategoriesPage() {
  return <ComingSoon moduleId="categories" />;
}
