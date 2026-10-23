import { describe, expect, it } from "vitest";
import { NAV_ITEMS, findActiveNavItem, getSectionTitle, getTopbarConfig } from "./navigation";

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

describe("getTopbarConfig", () => {
  it("keeps the section title of 10A by default", () => {
    expect(getTopbarConfig("/")).toEqual({ variant: "section", title: "Café Central · Resumen" });
    expect(getTopbarConfig("/settings")).toEqual({
      variant: "section",
      title: "Café Central · Configuración",
    });
  });

  it("shows the branch without the shift and the administrator pill on the 06 payment settings", () => {
    expect(getTopbarConfig("/payments")).toEqual({
      variant: "admin-location",
      title: "Café Central · Sede Centro",
    });
  });

  it("adds the live pill and the compact profile on the 03 orders screen", () => {
    expect(getTopbarConfig("/orders")).toEqual({
      variant: "live-location",
      title: "Café Central · Sede Centro · Turno mañana",
    });
  });

  it("reuses the 03 live top bar on the 04 bill requests screen", () => {
    expect(getTopbarConfig("/bill-requests")).toEqual({
      variant: "live-location",
      title: "Café Central · Sede Centro · Turno mañana",
    });
  });

  it("shows the verified-data pill on the 05 collections history screen", () => {
    expect(getTopbarConfig("/history")).toEqual({
      variant: "verified-location",
      title: "Café Central · Sede Centro · Turno mañana",
    });
  });

  it("shows the catalogue title and the synced pill on the 07 products screen only", () => {
    expect(getTopbarConfig("/menu/products")).toEqual({
      variant: "catalog",
      title: "Café Central · Carta digital",
    });
    expect(getTopbarConfig("/menu").variant).toBe("section");
    expect(getTopbarConfig("/menu/categories").variant).toBe("section");
  });

  it("shows the branch and shift on the 02 tables screen", () => {
    expect(getTopbarConfig("/tables")).toEqual({
      variant: "location",
      title: "Café Central · Sede Centro · Turno mañana",
    });
    expect(getTopbarConfig("/tables/qr").variant).toBe("section");
  });
});
