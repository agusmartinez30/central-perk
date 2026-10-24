import { describe, expect, it } from "vitest";
import { SERVICE_DAY } from "@/mocks/service-day";
import {
  createSpaceId,
  deleteSpace,
  getSpaceCards,
  getSpaceName,
  getSpaceRemoval,
  moveSpace,
  saveSpace,
  validateSpaceName,
} from "./space-config";

const { spaces, tables } = SERVICE_DAY;

describe("getSpaceCards", () => {
  it("counts the tables of each space", () => {
    expect(getSpaceCards(spaces, tables)).toEqual([
      { id: "salon", name: "Salón", icon: "store", tone: "brand", tableCount: 5, countLabel: "5 mesas" },
      { id: "terraza", name: "Terraza", icon: "sun", tone: "warning", tableCount: 3, countLabel: "3 mesas" },
      { id: "patio", name: "Patio", icon: "trees", tone: "success", tableCount: 4, countLabel: "4 mesas" },
    ]);
  });
});

describe("getSpaceName", () => {
  it("names a table's space, or flags an unknown one", () => {
    expect(getSpaceName(spaces, "terraza")).toBe("Terraza");
    expect(getSpaceName(spaces, "nope")).toBe("Sin espacio");
  });
});

describe("validateSpaceName", () => {
  it("requires a short name, unique ignoring case, spaces and accents", () => {
    expect(validateSpaceName("  ", spaces, null)).toBe("Ingresá el nombre del espacio.");
    expect(validateSpaceName("x".repeat(25), spaces, null)).toBe("Usá hasta 24 caracteres.");
    expect(validateSpaceName(" SALON ", spaces, null)).toBe("Ese espacio ya existe.");
    expect(validateSpaceName("Salón", spaces, "salon")).toBeNull();
    expect(validateSpaceName("Barra", spaces, null)).toBeNull();
  });
});

describe("saving spaces", () => {
  it("derives a unique slug id for new spaces", () => {
    expect(createSpaceId("Barra alta", spaces)).toBe("barra-alta");
    expect(createSpaceId("Salón", spaces)).toBe("salon-2");
    expect(createSpaceId("¡!", spaces)).toBe("espacio");
  });

  it("creates a space with the default icon, or renames an existing one keeping its id", () => {
    const created = saveSpace(spaces, null, " Barra ");
    expect(created.id).toBe("barra");
    expect(created.spaces.at(-1)).toEqual({ id: "barra", name: "Barra", icon: "map-pin", tone: "neutral" });
    const renamed = saveSpace(spaces, "patio", "Patio interno");
    expect(renamed.id).toBe("patio");
    expect(renamed.spaces[2]).toEqual({ id: "patio", name: "Patio interno", icon: "trees", tone: "success" });
    expect(renamed.spaces).toHaveLength(3);
  });
});

describe("space style", () => {
  it("creates or restyles a space with the chosen icon and tone", () => {
    const created = saveSpace(spaces, null, "Barra", { icon: "store", tone: "warning" });
    expect(created.spaces.at(-1)).toEqual({ id: "barra", name: "Barra", icon: "store", tone: "warning" });
    const restyled = saveSpace(spaces, "salon", "Salón", { icon: "sun", tone: "neutral" });
    expect(restyled.spaces[0]).toEqual({ id: "salon", name: "Salón", icon: "sun", tone: "neutral" });
  });
});

describe("reordering spaces", () => {
  it("moves a space one place up or down, keeping the ends in place", () => {
    expect(moveSpace(spaces, "patio", -1).map((space) => space.id)).toEqual(["salon", "patio", "terraza"]);
    expect(moveSpace(spaces, "salon", 1).map((space) => space.id)).toEqual(["terraza", "salon", "patio"]);
    expect(moveSpace(spaces, "salon", -1)).toBe(spaces);
    expect(moveSpace(spaces, "patio", 1)).toBe(spaces);
    expect(moveSpace(spaces, "nope", 1)).toBe(spaces);
  });
});

describe("deleting spaces", () => {
  it("only deletes a space without tables", () => {
    expect(getSpaceRemoval(spaces, tables, "patio")).toEqual({
      allowed: false,
      reason: "Patio tiene 4 mesas. Mové o eliminá sus mesas antes de eliminar el espacio.",
    });
    const withBarra = saveSpace(spaces, null, "Barra").spaces;
    expect(getSpaceRemoval(withBarra, tables, "barra")).toEqual({ allowed: true });
    expect(deleteSpace(withBarra, tables, "barra")).toEqual(spaces);
    expect(deleteSpace(spaces, tables, "patio")).toBe(spaces);
  });

  it("never deletes the last space", () => {
    const only = [spaces[0]];
    expect(getSpaceRemoval(only, [], "salon")).toEqual({ allowed: false, reason: "El local necesita al menos un espacio." });
    expect(deleteSpace(only, [], "salon")).toBe(only);
  });
});
