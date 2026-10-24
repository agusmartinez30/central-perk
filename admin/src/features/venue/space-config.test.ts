import { describe, expect, it } from "vitest";
import { SERVICE_DAY } from "@/mocks/service-day";
import { createSpaceId, getSpaceCards, getSpaceName, saveSpace, validateSpaceName } from "./space-config";

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
