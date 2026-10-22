import clsx from "clsx";
import type { CafeScheduleRow } from "@/mocks/types";
import { CAFE_INFO_COPY } from "./cafe-info-copy";

/** White weekly schedule card; closed days are dimmed and read "Cerrado". */
export function HoursTable({ rows }: { rows: readonly CafeScheduleRow[] }) {
  return (
    <dl className="flex w-full flex-col rounded-2xl bg-surface px-4 py-1 outline-1 -outline-offset-[0.5px] outline-line outline-solid">
      {rows.map(({ days, hours }) => (
        <div
          key={days}
          className={clsx(
            "flex h-[46px] items-center justify-between border-b border-line text-[12px] last:border-b-0",
            hours ? "text-ink" : "text-muted",
          )}
        >
          <dt className="font-bold">{days}</dt>
          <dd>{hours ?? CAFE_INFO_COPY.hours.closedDay}</dd>
        </div>
      ))}
    </dl>
  );
}
