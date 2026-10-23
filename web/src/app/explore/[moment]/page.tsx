import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOMENTS, getMomentById } from "@/mocks/moments";
import type { Moment } from "@/mocks/types";
import { ExploreResults, resolveFilterId } from "@/features/explore";

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

export default async function ExploreMomentPage({
  params,
  searchParams,
}: PageProps<"/explore/[moment]">) {
  const moment = getMomentById((await params).moment);
  if (!moment) notFound();
  // searchParams is request-time data: the prerendered shell shows the default
  // sub-filter, and `?filter=` streams in behind Suspense (Cache Components).
  return (
    <Suspense fallback={<ExploreResults moment={moment} />}>
      <MomentResults moment={moment} searchParams={searchParams} />
    </Suspense>
  );
}

async function MomentResults({
  moment,
  searchParams,
}: {
  moment: Moment;
  searchParams: PageProps<"/explore/[moment]">["searchParams"];
}) {
  const initialFilterId = resolveFilterId(moment, (await searchParams).filter);
  // Keyed so a new `?filter=` on the same moment resets the chip state.
  return <ExploreResults key={initialFilterId} moment={moment} initialFilterId={initialFilterId} />;
}
