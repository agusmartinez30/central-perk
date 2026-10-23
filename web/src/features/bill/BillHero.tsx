import { LINE_ART_SRC } from "@/features/menu";

type BillHeroProps = {
  line: string;
  accent: string;
  supporting: string;
  /** Illustration opacity: dimmed on the closed account (08F). */
  artOpacity?: number;
};

/** Editorial hero of 08A–F: blue line-art illustration beside a two-line heading. */
export function BillHero({ line, accent, supporting, artOpacity = 1 }: BillHeroProps) {
  return (
    <section className="flex h-32 w-full items-center gap-3.5">
      <div className="relative h-28 w-[132px] shrink-0 overflow-hidden" style={{ opacity: artOpacity }} aria-hidden="true">
        <div className="absolute top-0.5 left-5 h-[136px] w-[140px] rounded-[40px] bg-white/70" />
        {/* The white line-art PNG is reused as a mask so it can be painted in brand blue. */}
        <div
          className="absolute inset-1 bg-brand-2"
          style={{
            maskImage: `url("${LINE_ART_SRC}")`,
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <h2 className="flex flex-col">
          <span className="text-[23px] leading-tight font-bold tracking-[-0.6px] text-ink">{line}</span>
          <span className="font-display text-[34px] leading-none font-bold text-brand">{accent}</span>
        </h2>
        <p className="text-[10.5px] leading-[14px] text-muted">{supporting}</p>
      </div>
    </section>
  );
}
