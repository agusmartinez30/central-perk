import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOMENTS, getMomentById } from "@/mocks/moments";
import { ExploreResults } from "@/features/explore";

/** Every moment is known ahead of time, so all result pages are prerendered. */
export function generateStaticParams() {
  return MOMENTS.map((moment) => ({ moment: moment.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/explore/[moment]">): Promise<Metadata> {
  const moment = getMomentById((await params).moment);
  return { title: moment ? `${moment.title} · Café Central` : "Café Central" };
}

export default async function ExploreMomentPage({ params }: PageProps<"/explore/[moment]">) {
  const moment = getMomentById((await params).moment);
  if (!moment) notFound();
  return <ExploreResults moment={moment} />;
}
