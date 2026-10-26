import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import {
  PREVIEW_QUANTITY_MAX,
  getPreviewAddLabel,
  getPreviewSelection,
  getPreviewTotal,
  stepPreviewQuantity,
  togglePreviewOption,
} from "./preview-order";
import { getPreviewModel, toProductDraft, type ProductDraft } from "./product-form";

const cappuccino = toProductDraft(PRODUCTS.find((product) => product.id === "cappuccino")!);
const previewOf = (draft: ProductDraft = cappuccino) => getPreviewModel(draft);

describe("preview order", () => {
  it("starts from the preselected options and adds their deltas to the base price", () => {
    const preview = previewOf();
    const selection = getPreviewSelection(preview, {});
    expect(selection).toEqual({ tamano: ["mediano"], extras: [] });
    expect(getPreviewTotal(preview, selection, 1)).toBe(5400);
    expect(getPreviewAddLabel(preview, selection, 1)).toBe("Agregar · $5.400");
  });

  it("replaces the choice of a required single group and never leaves it empty", () => {
    const preview = previewOf();
    let selection = togglePreviewOption(preview, getPreviewSelection(preview, {}), "tamano", "grande");
    expect(selection.tamano).toEqual(["grande"]);
    selection = togglePreviewOption(preview, selection, "tamano", "grande");
    expect(selection.tamano).toEqual(["grande"]);
    expect(getPreviewTotal(preview, selection, 1)).toBe(6100);
  });

  it("clears the choice of an optional single group when it is picked again", () => {
    const draft: ProductDraft = {
      ...cappuccino,
      optionGroups: cappuccino.optionGroups.map((group) => (group.id === "tamano" ? { ...group, required: false } : group)),
    };
    const preview = previewOf(draft);
    expect(getPreviewSelection(preview, {}).tamano).toEqual([]);
    const picked = togglePreviewOption(preview, getPreviewSelection(preview, {}), "tamano", "chico");
    expect(picked.tamano).toEqual(["chico"]);
    expect(togglePreviewOption(preview, picked, "tamano", "chico").tamano).toEqual([]);
  });

  it("toggles multiple options up to the group maximum", () => {
    const preview = previewOf();
    let selection = getPreviewSelection(preview, {});
    selection = togglePreviewOption(preview, selection, "extras", "shot-extra");
    selection = togglePreviewOption(preview, selection, "extras", "leche-vegetal");
    expect(selection.extras).toEqual(["shot-extra", "leche-vegetal"]);
    expect(togglePreviewOption(preview, selection, "extras", "canela")).toBe(selection);
    selection = togglePreviewOption(preview, selection, "extras", "shot-extra");
    expect(selection.extras).toEqual(["leche-vegetal"]);
  });

  it("multiplies the configured unit price by the quantity", () => {
    const preview = previewOf();
    let selection = togglePreviewOption(preview, getPreviewSelection(preview, {}), "tamano", "grande");
    selection = togglePreviewOption(preview, selection, "extras", "shot-extra");
    expect(getPreviewTotal(preview, selection, 2)).toBe(14000);
    expect(getPreviewAddLabel(preview, selection, 2)).toBe("Agregar · $14.000");
  });

  it("keeps the quantity between 1 and the maximum", () => {
    expect(stepPreviewQuantity(1, -1)).toBe(1);
    expect(stepPreviewQuantity(1, 1)).toBe(2);
    expect(stepPreviewQuantity(PREVIEW_QUANTITY_MAX, 1)).toBe(PREVIEW_QUANTITY_MAX);
  });

  it("drops choices the edited draft no longer offers and respects the current rules", () => {
    const preview = previewOf();
    const selection = getPreviewSelection(preview, {
      tamano: ["gone"],
      extras: ["shot-extra", "x", "leche-vegetal", "canela"],
      removed: ["a"],
    });
    expect(selection).toEqual({ tamano: ["mediano"], extras: ["shot-extra", "leche-vegetal"] });
    const unknown = togglePreviewOption(preview, selection, "nope", "chico");
    expect(unknown).toBe(selection);
  });
});
