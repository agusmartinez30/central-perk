import { describe, expect, it } from "vitest";
import { getLegacyQrRedirect, getTablesViewHref, parseTablesView } from "./tables-view";

describe("parseTablesView", () => {
  it("opens the QR codes tab only for ?view=qr", () => {
    expect(parseTablesView("qr")).toBe("qr");
    expect(parseTablesView(" QR ")).toBe("qr");
  });

  it("falls back to the plan for a missing or unknown view", () => {
    expect(parseTablesView(null)).toBe("plan");
    expect(parseTablesView(undefined)).toBe("plan");
    expect(parseTablesView("")).toBe("plan");
    expect(parseTablesView("plan")).toBe("plan");
    expect(parseTablesView("list")).toBe("plan");
  });
});

describe("getTablesViewHref", () => {
  it("links each tab of Gestión de mesas", () => {
    expect(getTablesViewHref("plan")).toBe("/tables/management");
    expect(getTablesViewHref("qr")).toBe("/tables/management?view=qr");
  });
});

describe("getLegacyQrRedirect", () => {
  it("sends the old QR screen to the QR codes tab", () => {
    expect(getLegacyQrRedirect(undefined)).toBe("/tables/management?view=qr");
    expect(getLegacyQrRedirect("")).toBe("/tables/management?view=qr");
  });

  it("keeps the QR forced states on the QR codes tab", () => {
    expect(getLegacyQrRedirect("detail")).toBe("/tables/management?view=qr&state=detail");
    expect(getLegacyQrRedirect("regenerate")).toBe("/tables/management?view=qr&state=regenerate");
    expect(getLegacyQrRedirect("material")).toBe("/tables/management?view=qr&state=material");
    expect(getLegacyQrRedirect("Bulk-Print")).toBe("/tables/management?view=qr&state=bulk-print");
  });

  it("maps the table and space editing states that moved to the plan", () => {
    expect(getLegacyQrRedirect("edit")).toBe("/tables/management?state=table-edit");
    expect(getLegacyQrRedirect("new")).toBe("/tables/management?state=table-new");
    expect(getLegacyQrRedirect("errors")).toBe("/tables/management?state=errors");
    expect(getLegacyQrRedirect("space-edit")).toBe("/tables/management?state=space-edit");
    expect(getLegacyQrRedirect("space-new")).toBe("/tables/management?state=space-new");
  });

  it("drops unknown states and reads the first of repeated ones", () => {
    expect(getLegacyQrRedirect("table-edit")).toBe("/tables/management?view=qr");
    expect(getLegacyQrRedirect("nope")).toBe("/tables/management?view=qr");
    expect(getLegacyQrRedirect(["material", "edit"])).toBe("/tables/management?view=qr&state=material");
  });
});
