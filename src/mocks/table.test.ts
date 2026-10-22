import { describe, expect, it } from "vitest";
import { getOrderTotal, getTableTotal, SEED_ORDERS } from "@/mocks/table";

describe("table seed orders", () => {
  it("computes each order total from menu prices", () => {
    const [agustin, martina] = SEED_ORDERS;
    expect(agustin.lines.map((line) => line.unitPrice)).toEqual([5400, 3800]);
    expect(agustin.lines[0].customization).toBe("Mediano · Leche de almendras");
    expect(getOrderTotal(agustin)).toBe(13000);
    expect(getOrderTotal(martina)).toBe(6900);
  });

  it("sums the shared account total as in the designs", () => {
    expect(getTableTotal(SEED_ORDERS)).toBe(19900);
  });

  it("excludes cancelled orders from the shared total", () => {
    const [agustin, martina] = SEED_ORDERS;
    expect(getTableTotal([agustin, { ...martina, status: "cancelled" }])).toBe(13000);
  });
});
