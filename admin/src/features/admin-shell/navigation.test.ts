import { describe, expect, it } from "vitest";
import { NAV_ITEMS, findActiveNavItem, getSectionTitle } from "./navigation";

describe("NAV_ITEMS", () => {
  it("lists every admin module in the sidebar order of the designs", () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual([
      "Resumen",
      "Mesas",
      "Gestión de mesas",
      "Mesas y códigos QR",
      "Pedidos",
      "Solicitudes de cuenta",
      "Historial",
      "Carta digital",
      "Productos",
      "Categorías y momentos",
      "Configuración",
      "Pagos",
      "Personal y permisos",
    ]);
  });

  it("gives every module a unique route", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("findActiveNavItem", () => {
  it("matches the overview only on the root path", () => {
    expect(findActiveNavItem("/")?.id).toBe("overview");
    expect(findActiveNavItem("/orders")?.id).toBe("orders");
  });

  it("prefers the most specific nested route", () => {
    expect(findActiveNavItem("/tables")?.id).toBe("tables");
    expect(findActiveNavItem("/tables/qr")?.id).toBe("table-qr");
    expect(findActiveNavItem("/menu/products/42")?.id).toBe("products");
  });

  it("ignores trailing slashes and partial segment matches", () => {
    expect(findActiveNavItem("/orders/")?.id).toBe("orders");
    expect(findActiveNavItem("/ordersx")).toBeNull();
  });
});

describe("getSectionTitle", () => {
  it("prefixes the active module with the brand name", () => {
    expect(getSectionTitle("/")).toBe("Café Central · Resumen");
    expect(getSectionTitle("/bill-requests")).toBe("Café Central · Solicitudes de cuenta");
  });

  it("falls back to the brand name alone", () => {
    expect(getSectionTitle("/unknown")).toBe("Café Central");
  });
});
