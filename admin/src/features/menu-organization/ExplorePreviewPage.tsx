import { ArrowLeft, Package, Sun, Tags, type LucideIcon } from "lucide-react";
import type { OrganizationAction, PreviewView } from "./organization-state";
import { ExplorePhone } from "./ExplorePhone";
import { PageHeader } from "./OrganizationParts";

const RULES: readonly { id: string; icon: LucideIcon; title: string; copy: string }[] = [
  { id: "moments", icon: Sun, title: "Momentos", copy: "Colecciones editoriales sin restricción horaria." },
  { id: "categories", icon: Tags, title: "Categorías", copy: "Filtros de tipo de producto. “Todos” es virtual." },
  { id: "products", icon: Package, title: "Productos", copy: "Una sola entidad puede aparecer en varios momentos." },
];

const CHECKLIST = [
  "✓ No mostrar filtros de categorías vacías",
  "✓ Revalidar carrito al confirmar el pedido",
  "✓ Preservar información histórica de pedidos",
  "✓ Registrar cambios estructurales en auditoría",
];

type ExplorePreviewPageProps = { view: PreviewView; onAction: (action: OrganizationAction) => void };

/**
 * 08E · Customer Explore Preview ("Customer Preview Main"): the explore phone of the current
 * in-memory catalogue (or the moment editor's draft) next to the "Modelo de descubrimiento"
 * card, the three rule cards and the "Antes de publicar" checklist.
 */
export function ExplorePreviewPage({ view, onAction }: ExplorePreviewPageProps) {
  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3 px-7 pt-[18px] pb-4">
      <PageHeader
        title="Vista previa del cliente"
        subtitle="Validá cómo conviven momentos, categorías y productos."
        actions={
          <button
            type="button"
            onClick={() => onAction({ type: "close-preview" })}
            className="flex h-10 items-center gap-[7px] rounded-field bg-surface px-3.5 text-[12px] font-bold text-ink outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream"
          >
            <ArrowLeft size={15} aria-hidden="true" className="shrink-0" />
            {view.draft ? "Volver al editor" : "Volver"}
          </button>
        }
      />
      <div className="flex min-h-0 w-full flex-1 gap-[22px]">
        <ExplorePhone
          preview={view.preview}
          label={view.draft ? "Vista previa del borrador" : "Vista previa del cliente"}
          onFilterChange={(filterId) => onAction({ type: "set-preview-filter", filterId })}
          className="h-full"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <section className="flex flex-col gap-2.5 rounded-[14px] bg-brand p-5 text-white">
            <p className="text-[11px] font-bold tracking-[0.8px] text-white/67">MODELO DE DESCUBRIMIENTO</p>
            <h3 className="text-[24px] font-bold">Momento → filtros → productos</h3>
            <p className="text-[12px] leading-4">
              Cada relación es explícita. Asociar una categoría no incorpora automáticamente todos sus productos.
            </p>
          </section>
          <ul className="flex w-full gap-3">
            {RULES.map((rule) => (
              <li
                key={rule.id}
                className="flex h-[150px] flex-1 flex-col gap-2 rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line"
              >
                <rule.icon size={20} aria-hidden="true" className="text-brand" />
                <p className="text-[13px] font-bold text-ink">{rule.title}</p>
                <p className="text-[11px] leading-[14px] text-muted">{rule.copy}</p>
              </li>
            ))}
          </ul>
          <section className="flex flex-col gap-[9px] rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line">
            <h3 className="text-[13px] font-bold text-ink">Antes de publicar</h3>
            <ul className="flex flex-col gap-[9px]">
              {CHECKLIST.map((item) => (
                <li key={item} className="text-[12px] text-success">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
