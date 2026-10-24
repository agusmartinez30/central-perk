import clsx from "clsx";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { SPACE_ICONS, SPACE_TONES } from "@/features/venue/space-icons";
import type { SpaceCard } from "@/features/venue/space-config";

const cardClass = "flex h-[58px] min-w-0 flex-1 items-center gap-2.5 rounded-[10px] bg-surface px-3 outline-1 -outline-offset-[0.5px] outline-line";

/** Gestión de mesas opened on a space (`new` for the creation form). */
export const spaceManagementHref = (id: string) => `/tables/management?space=${encodeURIComponent(id)}`;

/**
 * 09A "Spaces Management": "Espacios" with its helper, one 58px card per space (icon on its tone,
 * name, derived table count, "Edit Space") and "Crear espacio". Spaces are configured in Gestión
 * de mesas, so editing and creating link there.
 */
export function SpacesManagement({ cards }: { cards: readonly SpaceCard[] }) {
  return (
    <section aria-labelledby="spaces-title" className="flex w-full shrink-0 flex-col gap-[7px]">
      <div className="flex w-full items-center justify-between">
        <h3 id="spaces-title" className="text-[13px] font-bold text-ink">
          Espacios
        </h3>
        <p className="text-[11px] text-muted">Los espacios y sus mesas se configuran en Gestión de mesas</p>
      </div>
      <ul className="flex h-[58px] w-full gap-[9px]">
        {cards.map((card) => {
          const Icon = SPACE_ICONS[card.icon];
          return (
            <li key={card.id} className={cardClass}>
              <span className={clsx("flex size-8 shrink-0 items-center justify-center rounded-nav", SPACE_TONES[card.tone])}>
                <Icon size={15} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-[13px] font-bold text-ink">{card.name}</p>
                <p className="text-[11px] text-muted">{card.countLabel}</p>
              </div>
              <Link
                href={spaceManagementHref(card.id)}
                aria-label={`Editar espacio ${card.name} en Gestión de mesas`}
                title="Editar en Gestión de mesas"
                className="flex size-7 shrink-0 items-center justify-center rounded-chip text-ink hover:bg-cream"
              >
                <Pencil size={13} aria-hidden="true" />
              </Link>
            </li>
          );
        })}
        <li className="flex min-w-0 flex-1">
          <Link
            href={spaceManagementHref("new")}
            className="flex h-[58px] w-full items-center justify-center gap-2 rounded-[10px] bg-brand-wash text-brand outline-1 -outline-offset-[0.5px] outline-brand hover:bg-brand/15"
          >
            <Plus size={15} aria-hidden="true" />
            <span className="text-[12px] font-bold">Crear espacio</span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
