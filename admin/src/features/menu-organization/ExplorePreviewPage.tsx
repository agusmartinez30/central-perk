import clsx from "clsx";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Info,
  Lock,
  PackageOpen,
  RefreshCw,
  Smartphone,
  Tablet,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { OrganizationAction, PreviewDevice, PreviewView } from "./organization-state";
import { ExplorePhone } from "./ExplorePhone";
import { PageHeader } from "./OrganizationParts";

/** "Modelo de exploración": the three discovery levels (static, 01 highlighted as in the export). */
const MODEL_STEPS = [
  { number: "01", label: "Momento", copy: "Define el contexto" },
  { number: "02", label: "Categoría", copy: "Filtra productos" },
  { number: "03", label: "Producto", copy: "Abre el detalle" },
] as const;

const DEVICES: readonly { id: PreviewDevice; label: string; icon: LucideIcon }[] = [
  { id: "phone", label: "Vista móvil", icon: Smartphone },
  { id: "tablet", label: "Vista tablet (ancho ampliado)", icon: Tablet },
];

type ExplorePreviewPageProps = { view: PreviewView; onAction: (action: OrganizationAction) => void };

/**
 * 08E · Preview Studio: header with "Solo lectura" and "Actualizar preview" (re-snapshots the saved
 * catalogue), then the exploration context rail (moment selector), the customer phone stage and
 * the prototyped flow with the empty-category sample and the unavailable-products warning. The
 * export has no way back; a neutral "Volver" button precedes the read-only pill.
 */
export function ExplorePreviewPage({ view, onAction }: ExplorePreviewPageProps) {
  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-[11px] px-7 pt-[18px] pb-4">
      <PageHeader
        breadcrumb="Carta digital / Preview Studio"
        title="Vista previa del cliente"
        subtitle="Explorá la carta como la verá un cliente, sin modificar contenido."
        actions={
          <>
            <StudioButton icon={ArrowLeft} tone="ink" onClick={() => onAction({ type: "close-preview" })}>
              {view.draft ? "Volver al editor" : "Volver"}
            </StudioButton>
            <span className="flex h-[30px] items-center gap-1.5 rounded-[15px] bg-sand px-2.5 text-muted">
              <Lock size={11} aria-hidden="true" />
              <span className="text-[11px] font-bold whitespace-nowrap">Solo lectura</span>
            </span>
            <StudioButton icon={RefreshCw} tone="brand" onClick={() => onAction({ type: "refresh-preview" })}>
              Actualizar preview
            </StudioButton>
          </>
        }
      />
      <div className="flex min-h-0 w-full flex-1 gap-3.5">
        <ContextRail view={view} onAction={onAction} />
        <PreviewStage view={view} onAction={onAction} />
        <InteractionInspector view={view} />
      </div>
    </div>
  );
}

type StudioButtonProps = { icon: LucideIcon; tone: "ink" | "brand"; onClick: () => void; children: ReactNode };

/** "Refresh Preview": 36px white outlined button (9px label → 12px). */
function StudioButton({ icon: Icon, tone, onClick, children }: StudioButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex h-9 items-center gap-1.5 rounded-nav bg-surface px-[11px] outline-1 -outline-offset-[0.5px] outline-line hover:bg-cream focus-visible:outline-2 focus-visible:outline-brand",
        tone === "brand" ? "text-brand" : "text-ink",
      )}
    >
      <Icon size={12} aria-hidden="true" className="shrink-0" />
      <span className="text-[12px] font-bold whitespace-nowrap">{children}</span>
    </button>
  );
}

const PANEL = "flex w-full shrink-0 flex-col rounded-card bg-surface p-4 outline-1 -outline-offset-[0.5px] outline-line";

/** "Context Rail": exploration summary with the moment selector, discovery model and info note. */
function ContextRail({ view, onAction }: ExplorePreviewPageProps) {
  const { context } = view;
  const rows = [
    { label: "Categorías disponibles", value: String(context.categories) },
    { label: "Productos visibles", value: String(context.products) },
    { label: "Filtro actual", value: context.filter },
  ];
  return (
    <aside aria-label="Contexto de exploración" className="flex w-[276px] shrink-0 flex-col gap-3 overflow-y-auto">
      <section className={clsx(PANEL, "gap-3")}>
        <h3 className="text-[14px] font-bold text-ink">Contexto de exploración</h3>
        <MomentSelector view={view} onAction={onAction} />
        <dl className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <dt className="text-[11px] text-muted">{row.label}</dt>
              <dd className="truncate text-[12px] font-bold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className={clsx(PANEL, "gap-2.5")}>
        <h3 className="text-[14px] font-bold text-ink">Modelo de exploración</h3>
        <p className="text-[11px] leading-[15px] text-muted">La navegación organiza el contenido en tres niveles:</p>
        <ol className="flex flex-col gap-2.5">
          {MODEL_STEPS.map((step, index) => (
            <li key={step.number} className="flex items-center gap-[9px]">
              <StepNumber number={step.number} active={index === 0} />
              <span className="flex flex-col gap-px">
                <span className="text-[12px] font-bold text-ink">{step.label}</span>
                <span className="text-[11px] text-muted">{step.copy}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <p className="flex w-full shrink-0 items-start gap-2 rounded-[10px] bg-[#f3f5fa] p-[11px] text-[11px] leading-[15px] text-muted">
        <Info size={13} aria-hidden="true" className="mt-px shrink-0 text-brand" />
        Esta preview representa la configuración actual. No ejecuta validaciones ni publica cambios.
      </p>
    </aside>
  );
}

const MOMENT_LABEL = "text-[11px] font-bold tracking-[0.6px] text-brand";

/**
 * "Selected Moment": the export only shows the value, so the switcher is a native select laid
 * over the box (chevron added). The editor draft and an empty catalogue show plain text.
 */
function MomentSelector({ view, onAction }: ExplorePreviewPageProps) {
  const selectable = view.canSwitchMoment && view.momentOptions.length > 0;
  const value = view.context.moment || (view.draft ? "Momento sin nombre" : "Sin momento visible");
  return (
    <div className="relative flex w-full flex-col gap-[3px] rounded-[9px] bg-brand-wash p-[11px] focus-within:outline-2 focus-within:outline-brand">
      {selectable ? (
        <label htmlFor="preview-moment" className={MOMENT_LABEL}>
          MOMENTO SELECCIONADO
        </label>
      ) : (
        <p className={MOMENT_LABEL}>MOMENTO SELECCIONADO</p>
      )}
      {selectable ? (
        <>
          <select
            id="preview-moment"
            value={view.momentOptions.find((option) => option.active)?.id ?? ""}
            onChange={(event) => onAction({ type: "set-preview-moment", id: event.target.value })}
            className="w-full cursor-pointer appearance-none bg-transparent pr-5 text-[13px] font-bold text-ink outline-none"
          >
            {view.momentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-[11px] bottom-[13px] text-brand" />
        </>
      ) : (
        <p className="truncate text-[13px] font-bold text-ink">
          {value}
        </p>
      )}
      {view.draft && <p className="text-[11px] text-muted">Borrador sin guardar del editor</p>}
    </div>
  );
}

function StepNumber({ number, active, size = "md" }: { number: string; active: boolean; size?: "sm" | "md" }) {
  return (
    <span
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-[7px] text-[11px] font-bold",
        size === "md" ? "size-[26px]" : "size-[25px]",
        active ? "bg-brand text-white" : "bg-sand text-muted",
      )}
    >
      {number}
    </span>
  );
}

/** "Primary Preview Stage": viewport header with the device toggle and the customer phone. */
function PreviewStage({ view, onAction }: ExplorePreviewPageProps) {
  const wide = view.device === "tablet";
  return (
    <section
      aria-label="Escenario de vista previa"
      className="flex h-full w-[530px] shrink-0 flex-col items-center gap-[9px] rounded-card bg-surface px-4 py-3 outline-1 -outline-offset-[0.5px] outline-line"
    >
      <div className="flex w-full shrink-0 items-center justify-between">
        <div className="flex flex-col gap-px">
          <h3 className="text-[13px] font-bold text-ink">{wide ? "Carta digital · Tablet" : "Carta digital · Móvil"}</h3>
          <p className="text-[11px] text-muted">
            {wide ? "Ancho ampliado del diseño móvil · Scroll interno" : "390 × 844 · Scroll interno"}
          </p>
        </div>
        <div role="group" aria-label="Dispositivo" className="flex gap-[5px]">
          {DEVICES.map(({ id, label, icon: Icon }) => {
            const selected = view.device === id;
            return (
              <button
                key={id}
                type="button"
                aria-label={label}
                title={label}
                aria-pressed={selected}
                onClick={() => onAction({ type: "set-preview-device", device: id })}
                className={clsx(
                  "flex size-7 items-center justify-center rounded-[7px] outline-1 -outline-offset-[0.5px] focus-visible:outline-2 focus-visible:outline-brand",
                  selected ? "bg-brand-wash text-brand outline-brand" : "bg-surface text-muted outline-line hover:text-ink",
                )}
              >
                <Icon size={12} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>
      <ExplorePhone
        preview={view.preview}
        label={view.draft ? "Vista previa del borrador" : "Vista previa del cliente"}
        wide={wide}
        onFilterChange={(filterId) => onAction({ type: "set-preview-filter", filterId })}
        className="flex-1"
      />
    </section>
  );
}

/** "Interaction Inspector": prototyped flow (current step highlighted), empty-category sample, warning. */
function InteractionInspector({ view }: { view: PreviewView }) {
  return (
    <aside aria-label="Recorrido prototipado" className="flex h-full min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
      <section className={clsx(PANEL, "gap-2.5")}>
        <h3 className="text-[14px] font-bold text-ink">Recorrido prototipado</h3>
        <p className="text-[11px] text-muted">Secuencia visual para inspeccionar la navegación.</p>
        <ol className="flex flex-col gap-2.5">
          {view.flow.map((step) => (
            <li key={step.number} aria-current={step.active ? "step" : undefined} className="flex items-center gap-2">
              <StepNumber number={step.number} active={step.active} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-[12px] font-bold text-ink">{step.label}</span>
                <span className="truncate text-[11px] text-muted">{step.state}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section className={clsx(PANEL, "gap-2")}>
        <div className="flex items-center gap-2">
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-nav bg-sand text-muted">
            <PackageOpen size={14} aria-hidden="true" />
          </span>
          <span className="flex flex-col gap-0.5">
            <h3 className="text-[13px] font-bold text-ink">Categoría sin productos</h3>
            <span className="text-[11px] text-muted">Estado disponible en el prototipo</span>
          </span>
        </div>
        <div className="flex h-[54px] w-full flex-col items-center justify-center gap-[3px] rounded-nav bg-[#faf9f6] text-[11px] font-bold">
          <p className="text-muted">Todavía no hay productos en esta categoría</p>
          <p className="text-brand">Ver todas las categorías</p>
        </div>
      </section>
      <p className="flex w-full shrink-0 items-start gap-2 rounded-[10px] bg-warning-bg p-[11px] text-[11px] leading-[15px] text-warning">
        <TriangleAlert size={13} aria-hidden="true" className="mt-px shrink-0" />
        Los productos no disponibles permanecen visibles únicamente para revisar su tratamiento visual.
      </p>
    </aside>
  );
}
