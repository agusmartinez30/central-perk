import Image from "next/image";
import { Armchair } from "lucide-react";
import { LINE_ART_SRC } from "@/features/menu";

type BillStatusHeroProps = {
  cafeName: string;
  table: string;
  title: string;
  /** Title size in px; 34 in the designs, 31 for the longest title (09E). */
  titleSize?: number;
  supporting: string;
  /** Illustration opacity: 1 normally, dimmed for offline (09D) and invalid (09E). */
  artOpacity?: number;
};

/** Blue 310px hero of screen 09 and its 09A–E variants. */
export function BillStatusHero({
  cafeName,
  table,
  title,
  titleSize = 34,
  supporting,
  artOpacity = 1,
}: BillStatusHeroProps) {
  return (
    <section className="flex min-h-[310px] w-full shrink-0 flex-col items-center bg-brand px-5 pt-2.5 pb-4 text-white">
      <div className="flex h-9 w-full items-center justify-between">
        <span className="text-[11px] font-bold tracking-[1.4px]">{cafeName.toUpperCase()}</span>
        <span className="flex h-[30px] items-center gap-1.5 rounded-[15px] bg-surface px-2.5 text-brand">
          <Armchair size={13} aria-hidden="true" />
          <span className="text-[10.5px] font-bold">Mesa {table}</span>
        </span>
      </div>
      <div className="flex h-[150px] w-full items-center justify-center" style={{ opacity: artOpacity }} aria-hidden="true">
        <Image
          src={LINE_ART_SRC}
          alt=""
          width={222}
          height={150}
          unoptimized
          loading="eager"
          className="h-[150px] w-[222px] object-contain"
        />
      </div>
      <div className="mt-1 flex w-full flex-col items-center gap-[5px] text-center">
        <h1 className="font-display leading-none font-bold" style={{ fontSize: titleSize }}>
          {title}
        </h1>
        <p className="max-w-[300px] text-[11.5px] leading-[15px] text-white/80">{supporting}</p>
      </div>
    </section>
  );
}
