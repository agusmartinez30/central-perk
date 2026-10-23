import { Plus } from "lucide-react";

/** "Product List Header": breadcrumb, title, subtitle and "New Product Button". */
export function ProductListHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <header className="flex w-full shrink-0 items-end justify-between">
      <div className="flex flex-col gap-[3px]">
        <p className="text-[11px] font-bold whitespace-nowrap text-brand">Carta digital / Productos</p>
        <h2 className="text-[24px] font-bold whitespace-nowrap text-ink">Gestión de productos</h2>
        <p className="text-[12px] whitespace-nowrap text-muted">Administrá los productos disponibles en tu carta digital.</p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="flex h-10 items-center gap-[7px] rounded-field bg-brand px-3.5 text-white hover:bg-brand/92"
      >
        <Plus size={15} aria-hidden="true" className="shrink-0" />
        <span className="text-[12px] font-bold whitespace-nowrap">Nuevo producto</span>
      </button>
    </header>
  );
}
