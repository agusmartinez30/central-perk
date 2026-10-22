import { describe, expect, it } from "vitest";
import { getOrderTotal, getTableTotal, SEED_ORDERS } from "@/mocks/table";

describe("table seed orders", () => {
  it("computes the order total from menu prices", () => {
    const [agustin] = SEED_ORDERS;
    expect(agustin.lines.map((line) => line.unitPrice)).toEqual([5400, 3800]);
    expect(agustin.lines[0].customization).toBe("Mediano · Leche de almendras");
    expect(getOrderTotal(agustin)).toBe(13000);
  });

  it("sums the shared account total", () => {
    expect(getTableTotal(SEED_ORDERS)).toBe(13000);
  });

  it("excludes cancelled orders from the shared total", () => {
    const [agustin] = SEED_ORDERS;
    const cancelled = { ...agustin, id: "order-1043", number: "1043", status: "cancelled" as const };
    expect(getTableTotal([agustin, cancelled])).toBe(13000);
  });
});
