import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LINE_ART_SRC } from "./WelcomeScreen";

/** "Especial de la casa" banner; the whole card leads to the Explore moments. */
export function PromoBanner() {
  return (
    <Link
      href="/explore"
      aria-label="Especial de la casa: explorar nuestras especialidades"
      className="relative mx-4 block h-[148px] shrink-0 overflow-hidden rounded-[20px] bg-brand text-white transition-transform active:scale-[0.99]"
    >
      <div className="absolute top-[15px] left-[18px] z-10 flex w-[205px] flex-col items-start gap-[5px]">
        <p className="text-[9px] font-bold tracking-[1.4px] text-white/78">ESPECIAL DE LA CASA</p>
        <h2 className="font-display text-[29px] leading-[26px] font-bold">
          Un café, un buen
          <br />
          momento.
        </h2>
        <p className="text-[10px] text-white/84">Descubrí nuestras especialidades.</p>
        <span className="flex items-center gap-1 text-[11px] font-bold">
          Explorar
          <ArrowUpRight size={13} aria-hidden="true" />
        </span>
      </div>
      <Image
        src={LINE_ART_SRC}
        alt=""
        width={150}
        height={124}
        unoptimized
        className="absolute top-3 left-[218px] h-[124px] w-[150px] object-contain opacity-92"
      />
    </Link>
  );
}
