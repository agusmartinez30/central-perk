import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/mocks/service-day";
import {
  EXTRAS_MAX_SELECTION,
  applyProductDraft,
  createEmptyDraft,
  formatOptionDelta,
  getPreviewModel,
  getProductChanges,
  hasFormErrors,
  parsePriceInput,
  toProductDraft,
  validateProductDraft,
  type ProductDraft,
} from "./product-form";
import { createProductId } from "./product-catalog";

const cappuccino = PRODUCTS.find((product) => product.id === "cappuccino")!;
const cappuccinoDraft = () => toProductDraft(cappuccino);
const otherNames = PRODUCTS.filter((product) => product.id !== "cappuccino").map((product) => product.name);
const validate = (draft: ProductDraft, mode: "draft" | "publish" = "publish") =>
  validateProductDraft(draft, { mode, otherNames });

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

describe("toProductDraft / applyProductDraft", () => {
  it("round-trips a product through the form", () => {
    const draft = cappuccinoDraft();
    expect(draft.price).toBe("$4.600");
    expect(draft.sizes[1]).toEqual({ id: "mediano", name: "Mediano", priceDelta: "800" });
    expect(applyProductDraft(draft, cappuccino, "publish")).toEqual(cappuccino);
  });

  it("applies the edits, trims the copy and sets the publication of the save", () => {
    const draft = { ...cappuccinoDraft(), name: "  Cappuccino doble ", price: "5.400", moments: ["tomar" as const] };
    const saved = applyProductDraft(draft, cappuccino, "draft");
    expect(saved).toMatchObject({ id: "cappuccino", name: "Cappuccino doble", price: 5400, moments: ["tomar"] });
    expect(saved.publication).toBe("draft");
  });

  it("drops the size default when there are no sizes and repairs a missing one", () => {
    const noSizes = applyProductDraft({ ...cappuccinoDraft(), sizes: [] }, cappuccino, "publish");
    expect(noSizes.defaultSizeId).toBeUndefined();
    const lostDefault = applyProductDraft({ ...cappuccinoDraft(), defaultSizeId: "gone" }, cappuccino, "publish");
    expect(lostDefault.defaultSizeId).toBe("chico");
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
      sizes: [],
      defaultSizeId: undefined,
      extras: [],
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
    const draft = cappuccinoDraft();
    const errors = validate({
      ...draft,
      sizes: [
        { id: "chico", name: " ", priceDelta: "0" },
        { id: "mediano", name: "Grande", priceDelta: "800" },
        { id: "grande", name: "grande", priceDelta: "1.500" },
      ],
      extras: [
        { id: "shot-extra", name: "Grande", priceDelta: "-1" },
        { id: "leche-vegetal", name: "Leche vegetal", priceDelta: "700" },
      ],
    });
    expect(errors.options).toEqual({
      chico: "Ingresá el nombre de la opción.",
      grande: "La opción ya existe en el grupo.",
      "shot-extra": "Ingresá un ajuste válido.",
    });
  });

  it("is empty when nothing is wrong, so hasFormErrors is false", () => {
    expect(validate(cappuccinoDraft())).toEqual({});
    expect(hasFormErrors({ options: {} })).toBe(false);
    expect(hasFormErrors({ options: { chico: "x" } })).toBe(true);
  });
});

describe("getProductChanges", () => {
  it("lists the edited fields in form order, ignoring surrounding spaces", () => {
    const saved = cappuccinoDraft();
    expect(getProductChanges(saved, { ...saved, name: " Cappuccino " })).toEqual([]);
    expect(
      getProductChanges(saved, {
        ...saved,
        price: "4.600",
        moments: ["desayunar", "merendar", "tomar"],
        extras: saved.extras.slice(0, 1),
        available: false,
        description: "Otra",
      }),
    ).toEqual(["Descripción", "Momentos de consumo", "Extras", "Disponibilidad"]);
  });

  it("compares moments as a set and prices by value", () => {
    const saved = cappuccinoDraft();
    expect(getProductChanges(saved, { ...saved, moments: ["merendar", "desayunar"], price: "4600" })).toEqual([]);
    expect(getProductChanges(saved, { ...saved, price: "4700", image: undefined, defaultSizeId: "grande" })).toEqual([
      "Precio base",
      "Imagen principal",
      "Tamaño",
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
      sizes: [
        { id: "chico", name: "Chico", selected: false },
        { id: "mediano", name: "Mediano", selected: true },
        { id: "grande", name: "Grande", selected: false },
      ],
      extras: [
        { id: "shot-extra", label: "Shot extra · +$900" },
        { id: "leche-vegetal", label: "Leche vegetal · +$700" },
      ],
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
      sizes: [],
      extras: [],
      addLabel: "Agregar · $0",
      categoryLabel: "Sin categoría",
      momentsLabel: "Sin momentos",
      availabilityLabel: "No disponible",
    });
  });

  it("skips options without a name and ignores invalid adjustments in the total", () => {
    const draft = cappuccinoDraft();
    const preview = getPreviewModel({
      ...draft,
      sizes: [{ id: "mediano", name: "Mediano", priceDelta: "abc" }],
      extras: [{ id: "x", name: " ", priceDelta: "100" }],
    });
    expect(preview.addLabel).toBe("Agregar · $4.600");
    expect(preview.extras).toEqual([]);
  });

  it("limits extras to three choices, as 07B says", () => {
    expect(EXTRAS_MAX_SELECTION).toBe(3);
  });
});
