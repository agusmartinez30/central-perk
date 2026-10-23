import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG_VERSION, CONSUMPTION_MOMENTS, PRODUCT_CATEGORIES, PRODUCTS, SERVICE_DAY } from "./index";

const productOf = (id: string) => PRODUCTS.find((product) => product.id === id);

describe("product catalogue", () => {
  it("keeps the names and prices the live screens (02–05, 10A) use", () => {
    expect(
      PRODUCTS.slice(0, 11).map(({ id, name, plural, price }) => ({ id, name, plural, price })),
    ).toEqual([
      { id: "cappuccino", name: "Cappuccino", plural: undefined, price: 4600 },
      { id: "cappuccino-grande", name: "Cappuccino grande", plural: undefined, price: 5200 },
      { id: "cafe-latte", name: "Café latte", plural: undefined, price: 4200 },
      { id: "cafe-con-leche", name: "Café con leche", plural: undefined, price: 3800 },
      { id: "jugo-naranja", name: "Jugo de naranja", plural: undefined, price: 5100 },
      { id: "medialuna", name: "Medialuna", plural: "Medialunas", price: 3900 },
      { id: "tostado-clasico", name: "Tostado clásico", plural: "Tostados clásicos", price: 7200 },
      { id: "tostado-jamon-queso", name: "Tostado de jamón y queso", plural: undefined, price: 6900 },
      { id: "toston-palta", name: "Tostón de palta", plural: undefined, price: 7500 },
      { id: "sandwich-pollo", name: "Sándwich de pollo", plural: undefined, price: 8900 },
      { id: "limonada", name: "Limonada", plural: undefined, price: 3600 },
    ]);
    expect(SERVICE_DAY.products).toBe(PRODUCTS);
  });

  it("adds the 07A products the live screens never sold, with the 07A prices", () => {
    expect(productOf("hamburguesa-clasica")).toMatchObject({
      name: "Hamburguesa clásica",
      price: 12500,
      categoryId: "hamburguesas",
    });
    expect(productOf("cheesecake")).toMatchObject({ name: "Cheesecake", price: 6800, categoryId: "postres" });
  });

  it("uses unique ids and names", () => {
    expect(new Set(PRODUCTS.map((product) => product.id)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((product) => product.name.toLowerCase())).size).toBe(PRODUCTS.length);
  });

  it("gives every product a known category, moments, a description and a positive price", () => {
    const categories = new Set(PRODUCT_CATEGORIES.map((category) => category.id));
    const moments = new Set(CONSUMPTION_MOMENTS.map((moment) => moment.id));
    for (const product of PRODUCTS) {
      expect(categories.has(product.categoryId), product.id).toBe(true);
      expect(product.moments.length, product.id).toBeGreaterThan(0);
      expect(product.moments.every((moment) => moments.has(moment)), product.id).toBe(true);
      expect(product.description.length, product.id).toBeGreaterThan(0);
      expect(product.description.length, product.id).toBeLessThanOrEqual(140);
      expect(Number.isInteger(product.price) && product.price > 0, product.id).toBe(true);
    }
  });

  it("points every product image at a file in public/", () => {
    for (const product of PRODUCTS) {
      if (!product.image) continue;
      expect(product.image, product.id).toMatch(/^\/images\/products\/[a-z0-9-]+\.webp$/);
      expect(existsSync(path.join(process.cwd(), "public", product.image)), product.image).toBe(true);
    }
  });

  it("keeps size defaults inside the sizes and non-negative option prices", () => {
    for (const product of PRODUCTS) {
      if (product.sizes.length > 0) {
        expect(product.sizes.some((size) => size.id === product.defaultSizeId), product.id).toBe(true);
      } else {
        expect(product.defaultSizeId, product.id).toBeUndefined();
      }
      for (const option of [...product.sizes, ...product.extras]) {
        expect(Number.isInteger(option.priceDelta) && option.priceDelta >= 0, option.id).toBe(true);
      }
    }
  });

  it("describes the Cappuccino as 07B does, on the canonical price", () => {
    expect(productOf("cappuccino")).toMatchObject({
      description: "Espresso intenso con leche vaporizada y espuma cremosa.",
      categoryId: "cafes",
      moments: ["desayunar", "merendar"],
      publication: "published",
      available: true,
      archived: false,
      allowCustomerNotes: true,
      image: "/images/products/cappuccino.webp",
      defaultSizeId: "mediano",
      sizes: [
        { id: "chico", name: "Chico", priceDelta: 0 },
        { id: "mediano", name: "Mediano", priceDelta: 800 },
        { id: "grande", name: "Grande", priceDelta: 1500 },
      ],
      extras: [
        { id: "shot-extra", name: "Shot extra", priceDelta: 900 },
        { id: "leche-vegetal", name: "Leche vegetal", priceDelta: 700 },
      ],
    });
  });

  it("starts with one draft, one unavailable product and nothing archived", () => {
    expect(PRODUCTS.filter((product) => product.publication === "draft").map((product) => product.id)).toEqual([
      "cheesecake",
    ]);
    expect(PRODUCTS.filter((product) => !product.available).map((product) => product.id)).toEqual([
      "hamburguesa-clasica",
    ]);
    expect(PRODUCTS.some((product) => product.archived)).toBe(false);
    expect(CATALOG_VERSION).toBe(42);
  });

  it("names the categories and moments as 07A/07B do", () => {
    expect(PRODUCT_CATEGORIES.map((category) => category.label)).toEqual([
      "Cafés",
      "Bebidas",
      "Panadería",
      "Tostadas",
      "Tostados",
      "Sándwiches",
      "Hamburguesas",
      "Postres",
    ]);
    expect(CONSUMPTION_MOMENTS.map((moment) => moment.label)).toEqual(["Desayunar", "Merendar", "Cenar", "Tomar"]);
  });
});
