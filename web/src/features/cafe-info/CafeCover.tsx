import Image from "next/image";
import clsx from "clsx";

type CafeCoverProps = {
  src: string;
  /** Status chip over the photo, e.g. "Abierto ahora". */
  statusLabel: string;
  open: boolean;
};

/** 192px cover photo with a bottom fade and the opening status chip. */
export function CafeCover({ src, statusLabel, open }: CafeCoverProps) {
  return (
    <div className="w-full shrink-0 px-4 pb-3">
      <div className="relative h-[192px] overflow-hidden rounded-[20px]">
        <Image src={src} alt="" fill priority sizes="358px" className="object-cover" />
        <div
          className="absolute inset-x-0 bottom-0 h-[77px] bg-linear-to-b from-ink/0 to-ink/72"
          aria-hidden="true"
        />
        <span className="absolute bottom-4 left-4 flex h-7 items-center gap-1.5 rounded-[14px] bg-surface px-2.5">
          <span className={clsx("size-[7px] rounded-full", open ? "bg-success" : "bg-muted")} aria-hidden="true" />
          <span className={clsx("text-[10px] font-bold", open ? "text-success" : "text-muted")}>{statusLabel}</span>
        </span>
      </div>
    </div>
  );
}
