import Link from "next/link";
import { Coffee, Info, MapPin, Search } from "lucide-react";
import { NAV_FORWARD } from "@/shared/ui";

type MenuHeaderProps = {
  cafeName: string;
  table: string;
};

const roundAction =
  "flex size-[34px] shrink-0 items-center justify-center rounded-full bg-surface text-ink outline-1 -outline-offset-[0.5px] outline-line outline-solid";

/** Sticky menu header: logo, café name with open status, table pill and quick actions. */
export function MenuHeader({ cafeName, table }: MenuHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[62px] items-center justify-between bg-cream px-4 pt-[5px] pb-[7px]">
      <div className="flex items-center gap-[9px]">
        <span className="flex size-[38px] items-center justify-center rounded-full bg-brand text-white">
          <Coffee size={20} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-px">
          <h1 className="text-[15px] font-bold text-ink">{cafeName}</h1>
          <span className="flex items-center gap-[5px] text-[10px] font-bold text-success">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Abierto
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex h-[34px] items-center gap-[5px] rounded-[17px] bg-surface px-2.5 outline-1 -outline-offset-[0.5px] outline-line outline-solid">
          <MapPin size={13} className="text-brand" aria-hidden="true" />
          <span className="text-[10px] font-bold text-ink">Mesa {table}</span>
        </span>
        {/* Search is visual only in this prototype. */}
        <button type="button" aria-label="Buscar" className={roundAction}>
          <Search size={16} aria-hidden="true" />
        </button>
        <Link
          href="/info"
          aria-label="Información del café"
          transitionTypes={NAV_FORWARD}
          className={roundAction}
        >
          <Info size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
