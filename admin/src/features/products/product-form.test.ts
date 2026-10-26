import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import {
  applyProductDraft,
  createEmptyDraft,
  formatOptionDelta,
  getOptionGroupMeta,
  getOptionGroupsSummary,
  getOptionPriceLabel,
  getPreviewModel,
  getProductChanges,
  hasFormErrors,
  parsePriceInput,
  toProductDraft,
  validateProductDraft,
  type OptionGroupDraft,
  type ProductDraft,
} from "./product-form";
import { createProductId } from "./product-catalog";

const cappuccino = PRODUCTS.find((product) => product.id === "cappuccino")!;
const cappuccinoDraft = () => toProductDraft(cappuccino);
const otherNames = PRODUCTS.filter((product) => product.id !== "cappuccino").map((product) => product.name);
const validate = (draft: ProductDraft, mode: "draft" | "publish" = "publish") =>
  validateProductDraft(draft, { mode, otherNames });

/** The draft with one group replaced by `changes`. */
const withGroup = (draft: ProductDraft, id: string, changes: Partial<OptionGroupDraft>): ProductDraft => ({
  ...draft,
  optionGroups: draft.optionGroups.map((group) => (group.id === id ? { ...group, ...changes } : group)),
});

describe("parsePriceInput", () => {
  it("reads whole pesos with or without the symbol and thousands dots", () => {
    expect(parsePriceInput("4600")).toBe(4600);
    expect(parsePriceInput("$4.600")).toBe(4600);
    expect(parsePriceInput(" $ 12.500 ")).toBe(12500);
    expect(parsePriceInput("0")).toBe(0);
  });

  it("rejects empty, negative, decimal and malformed amounts", () => {
    for (const value of ["", "  ", "-100", "4,5", "4.60", "12a", "$", "1.2.3"]) {
      expect(parsePriceInput(value), value).toBeNull();
    }
  });
});

describe("formatOptionDelta", () => {
  it("writes the 07B price adjustments", () => {
    expect(formatOptionDelta(0)).toBe("+$0");
    expect(formatOptionDelta(800)).toBe("+$800");
    expect(formatOptionDelta(1500)).toBe("+$1.500");
  });
});

describe("getOptionPriceLabel", () => {
  it("reads a free option as included in a required group and free of charge in an optional one", () => {
    expect(getOptionPriceLabel(0, true)).toBe("Incluido");
    expect(getOptionPriceLabel(0, false)).toBe("Sin cargo");
  });

  it("writes other adjustments with the currency format", () => {
    expect(getOptionPriceLabel(800, true)).toBe("+$800");
    expect(getOptionPriceLabel(1500, false)).toBe("+$1.500");
  });
});

describe("getOptionGroupsSummary", () => {
  it("counts groups and options, as 07C does", () => {
    expect(getOptionGroupsSummary(cappuccino.optionGroups)).toBe("2 grupos · 6 opciones");
    expect(getOptionGroupsSummary([{ options: [{}] }])).toBe("1 grupo · 1 opción");
    expect(getOptionGroupsSummary([{ options: [] }])).toBe("1 grupo · 0 opciones");
    expect(getOptionGroupsSummary([])).toBe("Sin personalizaciones");
  });
});

describe("getOptionGroupMeta", () => {
  it("describes selection, requirement and limit, as the 07B group headers", () => {
    const [sizes, extras] = cappuccinoDraft().optionGroups;
    expect(getOptionGroupMeta(sizes)).toBe("Selección única · Obligatorio");
    expect(getOptionGroupMeta(extras)).toBe("Selección múltiple · Máximo 2");
    expect(getOptionGroupMeta({ ...extras, max: undefined })).toBe("Selección múltiple · Opcional");
    expect(getOptionGroupMeta({ ...sizes, options: [] })).toBe("Selección única · Sin opciones");
  });
});

describe("toProductDraft / applyProductDraft", () => {
  it("round-trips a product through the form", () => {
    const draft = cappuccinoDraft();
    expect(draft.price).toBe("$4.600");
    expect(draft.optionGroups.map((group) => group.title)).toEqual(["Tamaño", "Extras"]);
    expect(draft.optionGroups[0].options[1]).toEqual({ id: "mediano", name: "Mediano", priceDelta: "800" });
    expect(applyProductDraft(draft, cappuccino, "publish")).toEqual(cappuccino);
  });

  it("applies the edits, trims the copy and sets the publication of the save", () => {
    const draft = { ...cappuccinoDraft(), name: "  Cappuccino doble ", price: "5.400", moments: ["tomar" as const] };
    const saved = applyProductDraft(draft, cappuccino, "draft");
    expect(saved).toMatchObject({
      id: "cappuccino",
      sku: "CAF-014",
      name: "Cappuccino doble",
      price: 5400,
      moments: ["tomar"],
    });
    expect(saved.publication).toBe("draft");
  });

  it("drops the default of an empty group and repairs a missing one", () => {
    const noSizes = applyProductDraft(withGroup(cappuccinoDraft(), "tamano", { options: [] }), cappuccino, "publish");
    expect(noSizes.optionGroups[0].defaultOptionId).toBeUndefined();
    const lost = applyProductDraft(withGroup(cappuccinoDraft(), "tamano", { defaultOptionId: "gone" }), cappuccino, "publish");
    expect(lost.optionGroups[0].defaultOptionId).toBe("chico");
  });

  it("keeps defaults only in required single groups and limits only in multiple ones", () => {
    const optional = applyProductDraft(withGroup(cappuccinoDraft(), "tamano", { required: false }), cappuccino, "publish");
    expect(optional.optionGroups[0].defaultOptionId).toBeUndefined();
    const single = applyProductDraft(withGroup(cappuccinoDraft(), "extras", { selection: "single" }), cappuccino, "publish");
    expect(single.optionGroups[1].max).toBeUndefined();
  });

  it("trims group titles", () => {
    const saved = applyProductDraft(withGroup(cappuccinoDraft(), "extras", { title: "  Adicionales " }), cappuccino, "publish");
    expect(saved.optionGroups[1].title).toBe("Adicionales");
  });

  it("starts new products empty, available and accepting customer notes", () => {
    expect(createEmptyDraft()).toEqual({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      moments: [],
      image: undefined,
      available: true,
      allowCustomerNotes: true,
      optionGroups: [],
    });
  });
});

describe("createProductId", () => {
  it("slugs the name and avoids taken ids", () => {
    expect(createProductId("Té verde con jengibre", ["cappuccino"])).toBe("te-verde-con-jengibre");
    expect(createProductId("Cappuccino", ["cappuccino", "cappuccino-2"])).toBe("cappuccino-3");
    expect(createProductId("  ¡¡ ", [])).toBe("producto");
  });
});

describe("validateProductDraft", () => {
  it("accepts the saved Cappuccino", () => {
    expect(hasFormErrors(validate(cappuccinoDraft()))).toBe(false);
  });

  it("requires a unique name of at most 60 characters", () => {
    expect(validate({ ...cappuccinoDraft(), name: "  " }).name).toBe("Ingresá el nombre del producto.");
    expect(validate({ ...cappuccinoDraft(), name: "x".repeat(61) }).name).toBe("Usá hasta 60 caracteres.");
    expect(validate({ ...cappuccinoDraft(), name: " cafe LATTE " }).name).toBe("Ya existe un producto con ese nombre.");
  });

  it("requires a whole positive price", () => {
    expect(validate({ ...cappuccinoDraft(), price: "" }).price).toBe("Ingresá un precio válido.");
    expect(validate({ ...cappuccinoDraft(), price: "0" }).price).toBe("Ingresá un precio válido.");
    expect(validate({ ...cappuccinoDraft(), price: "4,5" }).price).toBe("Ingresá un precio válido.");
    expect(validate({ ...cappuccinoDraft(), price: "1.000.001" }).price).toBe("El precio máximo es $1.000.000.");
  });

  it("requires a category", () => {
    expect(validate({ ...cappuccinoDraft(), categoryId: "" }).categoryId).toBe("Elegí una categoría.");
  });

  it("asks for a description and an image only to publish", () => {
    const draft = { ...cappuccinoDraft(), description: " ", image: undefined };
    expect(validate(draft, "publish")).toMatchObject({
      description: "Ingresá una descripción para publicar.",
      image: "Agregá una imagen para publicar.",
    });
    expect(hasFormErrors(validate(draft, "draft"))).toBe(false);
    expect(validate({ ...draft, description: "x".repeat(141) }, "draft").description).toBe("Usá hasta 140 caracteres.");
  });

  it("checks every option: name, uniqueness inside its group and adjustment", () => {
    let draft = withGroup(cappuccinoDraft(), "tamano", {
      options: [
        { id: "chico", name: " ", priceDelta: "0" },
        { id: "mediano", name: "Grande", priceDelta: "800" },
        { id: "grande", name: "grande", priceDelta: "1.500" },
      ],
    });
    draft = withGroup(draft, "extras", {
      options: [
        { id: "shot-extra", name: "Grande", priceDelta: "-1" },
        { id: "leche-vegetal", name: "Leche vegetal", priceDelta: "700" },
      ],
    });
    expect(validate(draft).optionGroups).toEqual({
      tamano: { options: { chico: "Ingresá el nombre de la opción.", grande: "La opción ya existe en el grupo." } },
      extras: { options: { "shot-extra": "Ingresá un ajuste válido." } },
    });
  });

  it("checks group titles, their uniqueness and the selection limit", () => {
    let draft = withGroup(cappuccinoDraft(), "tamano", { title: " " });
    draft = { ...draft, optionGroups: [...draft.optionGroups, { ...draft.optionGroups[1], id: "grupo-1", max: 0 }] };
    expect(validate(draft).optionGroups).toEqual({
      tamano: { title: "Ingresá el nombre del grupo." },
      "grupo-1": { title: "El grupo ya existe.", max: "Ingresá un máximo válido." },
    });
  });

  it("is empty when nothing is wrong, so hasFormErrors is false", () => {
    expect(validate(cappuccinoDraft())).toEqual({});
    expect(hasFormErrors({ optionGroups: {} })).toBe(false);
    expect(hasFormErrors({ optionGroups: { tamano: { options: { chico: "x" } } } })).toBe(true);
    expect(hasFormErrors({ optionGroups: { tamano: { title: "x" } } })).toBe(true);
  });
});

describe("getProductChanges", () => {
  it("lists the edited fields in form order, ignoring surrounding spaces", () => {
    const saved = cappuccinoDraft();
    expect(getProductChanges(saved, { ...saved, name: " Cappuccino " })).toEqual([]);
    const extras = saved.optionGroups[1];
    expect(
      getProductChanges(saved, {
        ...withGroup(saved, "extras", { options: extras.options.slice(0, 1) }),
        price: "4.600",
        moments: ["desayunar", "merendar", "tomar"],
        available: false,
        description: "Otra",
      }),
    ).toEqual(["Descripción", "Momentos de consumo", "Extras", "Disponibilidad"]);
  });

  it("compares moments as a set and prices by value", () => {
    const saved = cappuccinoDraft();
    expect(getProductChanges(saved, { ...saved, moments: ["merendar", "desayunar"], price: "4600" })).toEqual([]);
    expect(
      getProductChanges(saved, { ...withGroup(saved, "tamano", { defaultOptionId: "grande" }), price: "4700", image: undefined }),
    ).toEqual(["Precio base", "Imagen principal", "Tamaño"]);
  });

  it("reports group settings and added or removed groups", () => {
    const saved = cappuccinoDraft();
    expect(getProductChanges(saved, withGroup(saved, "extras", { max: 3 }))).toEqual(["Extras"]);
    expect(getProductChanges(saved, withGroup(saved, "tamano", { required: false }))).toEqual(["Tamaño"]);
    expect(getProductChanges(saved, { ...saved, optionGroups: saved.optionGroups.slice(0, 1) })).toEqual([
      "Personalizaciones",
    ]);
  });
});

describe("getPreviewModel", () => {
  it("shows the draft as the customer would see it, with the default size added to the total", () => {
    const preview = getPreviewModel({ ...cappuccinoDraft(), moments: ["desayunar", "merendar", "tomar"] });
    expect(preview).toEqual({
      name: "Cappuccino",
      description: "Espresso intenso con leche vaporizada y espuma cremosa.",
      image: "/images/products/cappuccino.webp",
      price: "$4.600",
      groups: [
        {
          id: "tamano",
          title: "Tamaño",
          selection: "single",
          required: true,
          meta: "Obligatorio · Elegí 1",
          options: [
            { id: "chico", name: "Chico", priceLabel: "Incluido", selected: false },
            { id: "mediano", name: "Mediano", priceLabel: "+$800", selected: true },
            { id: "grande", name: "Grande", priceLabel: "+$1.500", selected: false },
          ],
        },
        {
          id: "extras",
          title: "Extras",
          selection: "multiple",
          required: false,
          meta: "Opcional · Hasta 2",
          options: [
            { id: "shot-extra", name: "Shot extra", priceLabel: "+$900", selected: false },
            { id: "leche-vegetal", name: "Leche vegetal", priceLabel: "+$700", selected: false },
            { id: "canela", name: "Canela", priceLabel: "Sin cargo", selected: false },
          ],
        },
      ],
      optionsSummary: "2 grupos · 6 opciones",
      addLabel: "Agregar · $5.400",
      categoryLabel: "Cafés",
      momentsLabel: "Desayunar · Merendar · Tomar",
      availabilityLabel: "Disponible",
    });
  });

  it("falls back for empty or invalid fields instead of failing", () => {
    const preview = getPreviewModel({ ...createEmptyDraft(), price: "abc", available: false });
    expect(preview).toMatchObject({
      name: "Nuevo producto",
      description: "",
      price: "$0",
      groups: [],
      optionsSummary: "Sin personalizaciones",
      addLabel: "Agregar · $0",
      categoryLabel: "Sin categoría",
      momentsLabel: "Sin momentos",
      availabilityLabel: "No disponible",
    });
  });

  it("skips options without a name, empty groups and invalid adjustments in the total", () => {
    let draft = withGroup(cappuccinoDraft(), "tamano", { options: [{ id: "mediano", name: "Mediano", priceDelta: "abc" }] });
    draft = withGroup(draft, "extras", { options: [{ id: "x", name: " ", priceDelta: "100" }] });
    const preview = getPreviewModel(draft);
    expect(preview.addLabel).toBe("Agregar · $4.600");
    expect(preview.groups.map((group) => group.id)).toEqual(["tamano"]);
  });

  it("says how many options an optional group allows, or none when unlimited", () => {
    const draft = withGroup(cappuccinoDraft(), "extras", { max: undefined });
    expect(getPreviewModel(draft).groups[1].meta).toBe("Opcional");
    const required = withGroup(cappuccinoDraft(), "extras", { required: true });
    expect(getPreviewModel(required).groups[1].meta).toBe("Obligatorio · Hasta 2");
  });
});
