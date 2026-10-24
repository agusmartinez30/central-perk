import { describe, expect, it } from "vitest";
import { SERVICE_DAY, TABLES_BOARD } from "@/mocks/service-day";
import type { ManagedTable } from "@/mocks/types";
import {
  TABLE_BOX,
  ZOOM,
  formatDuration,
  getChairs,
  getFitTransform,
  getPlanSummary,
  getSpacePlan,
  getSpaceTabs,
  zoomAround,
  zoomBy,
} from "./floor-plan";

const live = TABLES_BOARD.tables;
const { spaces, tables } = SERVICE_DAY;

describe("getChairs", () => {
  const sides = (capacity: number) => getChairs(capacity).map((chair) => chair.side);

  it("seats two people face to face and four on every side", () => {
    expect(sides(2)).toEqual(["top", "bottom"]);
    expect(sides(4)).toEqual(["top", "bottom", "left", "right"]);
  });

  it("doubles the long sides for six people", () => {
    expect(sides(6)).toEqual(["top", "top", "bottom", "bottom", "left", "right"]);
  });

  it("draws the export's chairs for four people inside the 150×132 table box", () => {
    expect(getChairs(4)).toEqual([
      { side: "top", x: 50, y: 0, width: 50, height: 7 },
      { side: "bottom", x: 50, y: 125, width: 50, height: 7 },
      { side: "left", x: 4, y: 45, width: 7, height: 42 },
      { side: "right", x: 139, y: 45, width: 7, height: 42 },
    ]);
  });

  it("spreads several chairs along a side", () => {
    const top = getChairs(6).filter((chair) => chair.side === "top");
    expect(top.map((chair) => [chair.x, chair.width])).toEqual([
      [30, 40],
      [80, 40],
    ]);
    for (const chair of getChairs(8)) {
      expect(chair.x + chair.width).toBeLessThanOrEqual(TABLE_BOX.width);
      expect(chair.y + chair.height).toBeLessThanOrEqual(TABLE_BOX.height);
    }
  });
});

describe("formatDuration", () => {
  it("shows minutes, then hours and padded minutes", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(18)).toBe("18 min");
    expect(formatDuration(68)).toBe("1 h 08 min");
    expect(formatDuration(121)).toBe("2 h 01 min");
  });
});

describe("getPlanSummary", () => {
  it("counts available, seated and bill-requested tables", () => {
    expect(getPlanSummary(live)).toEqual([
      { id: "available", label: "2 disponibles" },
      { id: "occupied", label: "5 ocupadas" },
      { id: "bill-requested", label: "5 solicitan cuenta" },
    ]);
    const one: ManagedTable = { ...live[0] };
    expect(getPlanSummary([one]).map((item) => item.label)).toEqual(["1 disponible", "0 ocupadas", "0 solicitan cuenta"]);
  });
});

describe("getSpaceTabs", () => {
  it("lists every space with its enabled tables", () => {
    expect(getSpaceTabs(spaces, tables)).toEqual([
      { id: "salon", name: "Salón", count: 5 },
      { id: "terraza", name: "Terraza", count: 3 },
      { id: "patio", name: "Patio", count: 4 },
    ]);
  });
});

describe("getSpacePlan", () => {
  it("places the space's tables at their layout with live labels", () => {
    const plan = getSpacePlan("salon", tables, live, "");
    expect(plan.map((table) => table.code)).toEqual(["M01", "M02", "M03", "M04", "M07"]);
    expect(plan[0]).toMatchObject({
      id: "table-01",
      tone: "free",
      capacityLabel: "2 personas",
      account: null,
      duration: null,
      x: 38,
      y: 64,
      shape: "rect",
      matches: true,
    });
    expect(plan[0].chairs).toHaveLength(2);
    expect(plan[1]).toMatchObject({ tone: "occupied", account: "$16.800" });
    expect(plan[1].duration).toMatch(/min$/);
    expect(plan[4]).toMatchObject({ code: "M07", tone: "bill", account: "$19.900", x: 406, y: 236 });
  });

  it("draws the patio tables round", () => {
    expect(getSpacePlan("patio", tables, live, "").map((table) => [table.code, table.shape])).toEqual([
      ["M09", "round"],
      ["M10", "round"],
      ["M11", "round"],
      ["M12", "round"],
    ]);
  });

  it("dims the tables that do not match the search", () => {
    const plan = getSpacePlan("salon", tables, live, "mesa 3");
    expect(plan.filter((table) => table.matches).map((table) => table.code)).toEqual(["M03"]);
  });

  it("leaves disabled tables off the plan", () => {
    const disabled = tables.map((table) => (table.number === 1 ? { ...table, enabled: false } : table));
    expect(getSpacePlan("salon", disabled, live, "").map((table) => table.code)).toEqual(["M02", "M03", "M04", "M07"]);
  });
});

describe("zoom", () => {
  it("steps the scale within the limits", () => {
    expect(zoomBy(1, 1)).toBe(1.2);
    expect(zoomBy(1, -1)).toBe(0.8);
    expect(zoomBy(ZOOM.max, 1)).toBe(ZOOM.max);
    expect(zoomBy(ZOOM.min, -1)).toBe(ZOOM.min);
  });

  it("fits and centers the tables in the viewport", () => {
    const transform = getFitTransform([{ x: 38, y: 64 }, { x: 590, y: 408 }], { width: 852, height: 640 }, 24);
    // Content is 702×476 px; the 804×592 usable area allows up to 1.145× (rounded down to 1.14).
    expect(transform.scale).toBe(1.14);
    expect(transform.x).toBeCloseTo((852 - 702 * 1.14) / 2 - 38 * 1.14, 5);
    expect(transform.y).toBeCloseTo((640 - 476 * 1.14) / 2 - 64 * 1.14, 5);
    expect(getFitTransform([], { width: 800, height: 600 })).toEqual({ scale: 1, x: 0, y: 0 });
  });
});

describe("zoomAround", () => {
  it("zooms in and out keeping the given point in place", () => {
    const zoomed = zoomAround({ scale: 1, x: 0, y: 0 }, 1, { x: 400, y: 300 });
    expect(zoomed).toEqual({ scale: 1.2, x: -80, y: -60 });
    expect(zoomAround(zoomed, -1, { x: 400, y: 300 })).toEqual({ scale: 1, x: 0, y: 0 });
    const max = { scale: ZOOM.max, x: 5, y: 5 };
    expect(zoomAround(max, 1, { x: 400, y: 300 })).toBe(max);
  });
});
