import { Plus } from "lucide-react";

/** "Commerce Header": breadcrumb, title, subtitle and "New Product". */
export function ProductListHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <header className="flex h-[70px] w-full shrink-0 items-center justify-between">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[11px] font-bold whitespace-nowrap text-brand">Carta digital / Productos</p>
        <h2 className="text-[26px] leading-tight font-bold whitespace-nowrap text-ink">Gestión de productos</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">Precio, visibilidad y disponibilidad en una sola vista</p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="flex h-10 items-center gap-[7px] rounded-field bg-brand px-[15px] text-white hover:bg-brand/92 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Plus size={15} aria-hidden="true" className="shrink-0" />
        <span className="text-[12px] font-bold whitespace-nowrap">Nuevo producto</span>
      </button>
    </header>
  );
}
