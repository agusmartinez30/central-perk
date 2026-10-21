import type { Metadata } from "next";
import { ExploreLanding } from "@/features/explore";

export const metadata: Metadata = { title: "Explorar · Café Central" };

export default function ExplorePage() {
  return <ExploreLanding />;
}
