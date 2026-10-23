"use client";

import { useReducer } from "react";
import { Plus } from "lucide-react";
import { useScreenState } from "@/shared/lib/use-screen-state";
import { MomentEditor } from "./MomentEditor";
import { MomentsGrid } from "./MomentsGrid";
import { MetricCards, OrganizationTabs, PageHeader } from "./OrganizationParts";
import {
  createOrganizationState,
  getMomentEditorView,
  getMomentsListView,
  organizationReducer,
  type OrganizationAction,
  type OrganizationState,
} from "./organization-state";

/**
 * Forced variants: `moment-edit` (08B: Para desayunar with Limonada associated and not saved),
 * `moment-new` (empty "Crear momento" form) and `moment-errors` (Para desayunar saved without a
 * name; not in the exports).
 */
export const ORGANIZATION_FORCED_STATES = ["moment-edit", "moment-new", "moment-errors"] as const;

type ForcedState = (typeof ORGANIZATION_FORCED_STATES)[number];

const FORCED_ACTIONS: Record<ForcedState, OrganizationAction[]> = {
  "moment-edit": [
    { type: "open-moment", id: "desayunar" },
    { type: "moment-add-product", id: "limonada" },
  ],
  "moment-new": [{ type: "open-new-moment" }],
  "moment-errors": [
    { type: "open-moment", id: "desayunar" },
    { type: "moment-set-field", field: "title", value: "" },
    { type: "moment-save" },
  ],
};

function initState(forcedState: ForcedState | null): OrganizationState {
  const state = createOrganizationState();
  if (!forcedState) return state;
  return { ...FORCED_ACTIONS[forcedState].reduce(organizationReducer, state), notice: null };
}

type PrimaryActionProps = { label: string; onClick: () => void };

/** "Primary Action": 40px brand button, 10px label → 12px. */
function PrimaryAction({ label, onClick }: PrimaryActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 items-center gap-[7px] rounded-field bg-brand px-3.5 text-white hover:bg-brand/92"
    >
      <Plus size={15} aria-hidden="true" className="shrink-0" />
      <span className="text-[12px] font-bold whitespace-nowrap">{label}</span>
    </button>
  );
}

/**
 * 08 · Categorías y momentos. Container: owns the moments, categories and product assignments
 * as edited in this session (pure `organizationReducer`, seeded from the canonical catalogue)
 * and which view is open: the "Organización de la carta" tabs (08A moments, 08C categories) or
 * an editor (08B). 07 keeps its own session copy of the products.
 */
export function MenuOrganizationScreen() {
  const forcedState = useScreenState(ORGANIZATION_FORCED_STATES);
  const [state, dispatch] = useReducer(organizationReducer, forcedState, initState);

  let content;
  const momentEditorView = getMomentEditorView(state);
  if (state.view === "moment-editor" && state.momentEditor && momentEditorView) {
    content = <MomentEditor editor={state.momentEditor} view={momentEditorView} onAction={dispatch} />;
  } else {
    const moments = getMomentsListView(state);
    content = (
      // The list fills the viewport under the 72px top bar, as in the 1440×900 export.
      <div className="flex h-[calc(100dvh-72px)] min-h-[760px] flex-col gap-3 px-7 pt-[18px] pb-4">
        <PageHeader
          title="Organización de la carta"
          subtitle="Definí cómo los clientes exploran tu menú."
          actions={<PrimaryAction label="Crear momento" onClick={() => dispatch({ type: "open-new-moment" })} />}
        />
        <MetricCards
          height="74"
          items={[
            { label: "Momentos visibles", value: moments.metrics.visibleMoments },
            { label: "Categorías activas", value: moments.metrics.activeCategories },
            { label: "Categorías totales", value: moments.metrics.totalCategories },
          ]}
        />
        <OrganizationTabs active={state.tab} onChange={(tab) => dispatch({ type: "set-tab", tab })} />
        {state.view === "moments" && (
          <MomentsGrid
            cards={moments.cards}
            onEdit={(id) => dispatch({ type: "open-moment", id })}
            onVisibilityChange={(id, visible) => dispatch({ type: "set-moment-visibility", id, visible })}
            onReorder={(id, toIndex) => dispatch({ type: "reorder-moment", id, toIndex })}
            onMove={(id, step) => dispatch({ type: "move-moment", id, step })}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {content}
      <p role="status" className="sr-only">
        {state.notice}
      </p>
    </>
  );
}
