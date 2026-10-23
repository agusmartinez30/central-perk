import { describe, expect, it } from "vitest";
import { PRODUCTS, type Product } from "@/mocks/service-day";
import {
  DEFAULT_PRODUCT_FILTERS,
  archiveProduct,
  duplicateProduct,
  filterProducts,
  formatProductCount,
  getDuplicateName,
  getProductMetrics,
  getProductStatus,
  getVisibleProducts,
  restoreProduct,
  setProductAvailability,
  sortProductsByName,
  type ProductFilters,
} from "./product-catalog";

const filters = (overrides: Partial<ProductFilters>): ProductFilters => ({ ...DEFAULT_PRODUCT_FILTERS, ...overrides });
const ids = (products: Product[]) => products.map((product) => product.id);
const byId = (products: Product[], id: string) => products.find((product) => product.id === id)!;

describe("filterProducts", () => {
  it("lists every product that is not archived by default", () => {
    const archived = archiveProduct(PRODUCTS, "limonada");
    expect(ids(filterProducts(archived, DEFAULT_PRODUCT_FILTERS))).not.toContain("limonada");
    expect(filterProducts(archived, DEFAULT_PRODUCT_FILTERS)).toHaveLength(PRODUCTS.length - 1);
  });

  it("filters by category and consumption moment", () => {
    expect(ids(filterProducts(PRODUCTS, filters({ category: "tostados" })))).toEqual([
      "tostado-clasico",
      "tostado-jamon-queso",
    ]);
    expect(ids(filterProducts(PRODUCTS, filters({ moment: "cenar" })))).toEqual([
      "tostado-clasico",
      "tostado-jamon-queso",
      "sandwich-pollo",
      "hamburguesa-clasica",
    ]);
  });

  it("filters by publication, with archived products only under their own filter", () => {
    const archived = archiveProduct(PRODUCTS, "limonada");
    expect(ids(filterProducts(archived, filters({ publication: "draft" })))).toEqual(["cheesecake"]);
    expect(ids(filterProducts(archived, filters({ publication: "archived" })))).toEqual(["limonada"]);
    expect(filterProducts(archived, filters({ publication: "published" }))).toHaveLength(PRODUCTS.length - 2);
  });

  it("filters by availability", () => {
    expect(ids(filterProducts(PRODUCTS, filters({ availability: "unavailable" })))).toEqual(["hamburguesa-clasica"]);
    expect(filterProducts(PRODUCTS, filters({ availability: "available" }))).toHaveLength(PRODUCTS.length - 1);
  });

  it("searches names and categories ignoring case and accents", () => {
    expect(ids(filterProducts(PRODUCTS, filters({ query: "  TOSTON " })))).toEqual(["toston-palta"]);
    expect(ids(filterProducts(PRODUCTS, filters({ query: "sandwich" })))).toEqual(["sandwich-pollo"]);
    expect(ids(filterProducts(PRODUCTS, filters({ query: "panaderia" })))).toEqual(["medialuna"]);
    expect(filterProducts(PRODUCTS, filters({ query: "pizza" }))).toEqual([]);
  });

  it("combines every filter", () => {
    expect(ids(filterProducts(PRODUCTS, filters({ category: "cafes", moment: "tomar", query: "latte" })))).toEqual([
      "cafe-latte",
    ]);
  });
});

describe("sortProductsByName", () => {
  it("orders by name as Spanish speakers read it, without mutating the input", () => {
    const input = [byId(PRODUCTS, "toston-palta"), byId(PRODUCTS, "cappuccino"), byId(PRODUCTS, "cafe-latte")];
    expect(ids(sortProductsByName(input))).toEqual(["cafe-latte", "cappuccino", "toston-palta"]);
    expect(ids(input)).toEqual(["toston-palta", "cappuccino", "cafe-latte"]);
  });

  it("is what getVisibleProducts returns after filtering", () => {
    expect(ids(getVisibleProducts(PRODUCTS, filters({ category: "bebidas" })))).toEqual(["jugo-naranja", "limonada"]);
    expect(ids(getVisibleProducts(PRODUCTS, DEFAULT_PRODUCT_FILTERS)).slice(0, 4)).toEqual([
      "cafe-con-leche",
      "cafe-latte",
      "cappuccino",
      "cappuccino-grande",
    ]);
  });
});

describe("getProductMetrics", () => {
  it("counts published products and their availability, as the 07A metric cards", () => {
    expect(getProductMetrics(PRODUCTS)).toEqual({ published: 12, available: 11, unavailable: 1 });
  });

  it("leaves archived products and drafts out", () => {
    const products = setProductAvailability(archiveProduct(PRODUCTS, "hamburguesa-clasica"), "cheesecake", false);
    expect(getProductMetrics(products)).toEqual({ published: 11, available: 11, unavailable: 0 });
  });
});

describe("getProductStatus", () => {
  it("reads archived before the publication", () => {
    expect(getProductStatus(byId(PRODUCTS, "cappuccino"))).toBe("published");
    expect(getProductStatus(byId(PRODUCTS, "cheesecake"))).toBe("draft");
    expect(getProductStatus(byId(archiveProduct(PRODUCTS, "cappuccino"), "cappuccino"))).toBe("archived");
  });
});

describe("getDuplicateName", () => {
  it("adds the copy suffix, numbering it when it is taken", () => {
    expect(getDuplicateName("Cappuccino", ["Cappuccino"])).toBe("Cappuccino (copia)");
    expect(getDuplicateName("Cappuccino", ["Cappuccino", "Cappuccino (copia)"])).toBe("Cappuccino (copia 2)");
    expect(getDuplicateName("Cappuccino", ["Cappuccino", "cappuccino (COPIA)", "Cappuccino (copia 2)"])).toBe(
      "Cappuccino (copia 3)",
    );
  });

  it("numbers copies of a copy from the original name", () => {
    expect(getDuplicateName("Cappuccino (copia)", ["Cappuccino", "Cappuccino (copia)"])).toBe("Cappuccino (copia 2)");
    expect(getDuplicateName("Cappuccino (copia 2)", ["Cappuccino (copia 2)"])).toBe("Cappuccino (copia)");
  });
});

describe("duplicateProduct", () => {
  it("inserts an unpublished copy right after the original", () => {
    const { products, product } = duplicateProduct(PRODUCTS, "cappuccino");
    expect(products).toHaveLength(PRODUCTS.length + 1);
    expect(products[1]).toBe(product);
    expect(product).toMatchObject({
      id: "cappuccino-copia",
      name: "Cappuccino (copia)",
      price: 4600,
      publication: "draft",
      archived: false,
      sizes: byId(PRODUCTS, "cappuccino").sizes,
    });
    expect(product?.plural).toBeUndefined();
    expect(PRODUCTS).toHaveLength(13);
  });

  it("keeps ids and names unique across copies", () => {
    const first = duplicateProduct(PRODUCTS, "cappuccino");
    const second = duplicateProduct(first.products, "cappuccino");
    expect(second.product).toMatchObject({ id: "cappuccino-copia-2", name: "Cappuccino (copia 2)" });
  });

  it("returns the list untouched for an unknown product", () => {
    const result = duplicateProduct(PRODUCTS, "nope");
    expect(result.products).toBe(PRODUCTS);
    expect(result.product).toBeNull();
  });
});

describe("archive, restore and availability", () => {
  it("archives without deleting and restores as a draft", () => {
    const archived = archiveProduct(PRODUCTS, "cappuccino");
    expect(archived).toHaveLength(PRODUCTS.length);
    expect(byId(archived, "cappuccino").archived).toBe(true);
    expect(byId(PRODUCTS, "cappuccino").archived).toBe(false);
    expect(byId(restoreProduct(archived, "cappuccino"),"cappuccino")).toMatchObject({
      archived: false,
      publication: "draft",
    });
  });

  it("toggles availability of one product", () => {
    const products = setProductAvailability(PRODUCTS, "cappuccino", false);
    expect(byId(products, "cappuccino").available).toBe(false);
    expect(byId(products, "limonada").available).toBe(true);
  });

  it("returns the same list when nothing changes", () => {
    expect(archiveProduct(PRODUCTS, "nope")).toBe(PRODUCTS);
    expect(setProductAvailability(PRODUCTS, "cappuccino", true)).toBe(PRODUCTS);
    expect(restoreProduct(PRODUCTS, "cappuccino")).toBe(PRODUCTS);
  });
});

describe("formatProductCount", () => {
  it("writes the 07A footer", () => {
    expect(formatProductCount(7)).toBe("7 productos · Ordenados por nombre");
    expect(formatProductCount(1)).toBe("1 producto · Ordenado por nombre");
    expect(formatProductCount(0)).toBe("Sin productos para estos filtros");
  });
});
