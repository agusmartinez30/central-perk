import { describe, expect, it } from "vitest";
import { getProductById } from "@/mocks/menu";
import type { Product } from "@/mocks/types";
import {
  formatChoicePrice,
  getFromPrice,
  getMissingRequiredGroups,
  getSelectedChoiceIds,
  initSelection,
  toggleChoice,
} from "./product-options";

const cappuccino = getProductById("cappuccino") as Product;
const espresso = getProductById("espresso-doble") as Product;
const tostado = getProductById("tostado-jamon-queso") as Product;
const group = (id: string) => cappuccino.optionGroups!.find((g) => g.id === id)!;

describe("initSelection", () => {
  it("preselects each group's default choice and leaves optional groups empty", () => {
    expect(initSelection(cappuccino)).toEqual({ tamano: ["mediano"], leche: ["entera"], extras: [] });
  });

  it("returns an empty selection for products without options", () => {
    expect(initSelection(espresso)).toEqual({});
  });
});

describe("toggleChoice", () => {
  it("replaces the choice in a single-selection group", () => {
    const next = toggleChoice(initSelection(cappuccino), group("tamano"), "grande");
    expect(next.tamano).toEqual(["grande"]);
  });

  it("keeps a single-selection choice when it is chosen again", () => {
    const next = toggleChoice(initSelection(cappuccino), group("tamano"), "mediano");
    expect(next.tamano).toEqual(["mediano"]);
  });

  it("toggles choices on and off in a multiple-selection group, in menu order", () => {
    let selection = toggleChoice(initSelection(cappuccino), group("extras"), "crema-batida");
    selection = toggleChoice(selection, group("extras"), "canela");
    expect(selection.extras).toEqual(["canela", "crema-batida"]);
    selection = toggleChoice(selection, group("extras"), "canela");
    expect(selection.extras).toEqual(["crema-batida"]);
  });

  it("ignores ids that do not belong to the group", () => {
    const selection = initSelection(cappuccino);
    expect(toggleChoice(selection, group("tamano"), "almendras")).toBe(selection);
  });
});

describe("getSelectedChoiceIds", () => {
  it("flattens the selection in group order", () => {
    const selection = toggleChoice(initSelection(cappuccino), group("extras"), "canela");
    expect(getSelectedChoiceIds(cappuccino, selection)).toEqual(["mediano", "entera", "canela"]);
  });
});

describe("getMissingRequiredGroups", () => {
  it("is empty for the default configuration", () => {
    expect(getMissingRequiredGroups(cappuccino, initSelection(cappuccino))).toEqual([]);
  });

  it("lists required groups without a selection, ignoring optional ones", () => {
    expect(getMissingRequiredGroups(cappuccino, { tamano: [], extras: [] })).toEqual([
      "tamano",
      "leche",
    ]);
  });
});

describe("formatChoicePrice", () => {
  it("shows the resulting price for absolute groups", () => {
    const tamano = group("tamano");
    expect(tamano.choices.map((choice) => formatChoicePrice(cappuccino, tamano, choice))).toEqual([
      "$3.800",
      "$4.500",
      "$5.200",
    ]);
  });

  it("shows +delta, or Incluida for zero, for delta groups", () => {
    const leche = group("leche");
    expect(leche.choices.map((choice) => formatChoicePrice(cappuccino, leche, choice))).toEqual([
      "Incluida",
      "Incluida",
      "+$900",
    ]);
    const extras = group("extras");
    expect(formatChoicePrice(cappuccino, extras, extras.choices[1])).toBe("+$1.200");
  });
});

describe("getFromPrice", () => {
  it("uses the cheapest required choice of each group", () => {
    expect(getFromPrice(cappuccino)).toEqual({ amount: 3800, varies: true });
  });

  it("reports a fixed price when required choices cost the same", () => {
    expect(getFromPrice(tostado)).toEqual({ amount: 6900, varies: false });
    expect(getFromPrice(espresso)).toEqual({ amount: 3200, varies: false });
  });
});
