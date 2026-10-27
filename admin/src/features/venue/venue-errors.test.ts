import { describe, expect, it } from "vitest";
import { describeVenueError, spaceIssueError, tableIssueErrors, VENUE_UNAVAILABLE } from "./venue-errors";
import { createVenueState } from "./venue-state";

const venue = createVenueState();
const move = { type: "move-table", id: "tbl_01", x: 222, y: 64 } as const;
const overlap = { kind: "conflict", code: "table_overlap", conflict: { id: "tbl_02", number: 2, label: "Mesa 02" } } as const;

describe("describeVenueError", () => {
  it("uses the auth copy when the API cannot be reached or fails", () => {
    expect(VENUE_UNAVAILABLE).toBe("No pudimos conectarnos con el servidor. Probá de nuevo en unos segundos.");
    expect(describeVenueError({ kind: "network" }, move, venue)).toBe(VENUE_UNAVAILABLE);
    expect(describeVenueError({ kind: "unknown" }, move, venue)).toBe(VENUE_UNAVAILABLE);
  });

  it("reuses the form copy for rejected input", () => {
    const invalid = { kind: "invalid", issues: [] } as const;
    expect(describeVenueError(invalid, { type: "save-table", editingId: "tbl_01", draft: {} as never }, venue)).toBe(
      "Revisá los datos marcados.",
    );
    expect(describeVenueError(invalid, { type: "save-space", editingId: null, name: "x" }, venue)).toBe("Revisá el nombre del espacio.");
  });

  it("reuses the plan copy for overlaps", () => {
    expect(describeVenueError(overlap, move, venue)).toBe("Mesa 01 no entra ahí: se superpone con Mesa 02.");
    expect(describeVenueError(overlap, { type: "resize-table", id: "tbl_01", x: 0, y: 0, width: 300, height: 132 }, venue)).toBe(
      "Mesa 01 no entra con ese tamaño: se superpone con Mesa 02.",
    );
  });

  it("reuses the removal copy for space and table conflicts", () => {
    expect(
      describeVenueError(
        { kind: "conflict", code: "space_not_removable", reason: "space_has_tables", tableCount: 1 },
        { type: "delete-space", id: "patio" },
        venue,
      ),
    ).toBe("Patio tiene 1 mesa. Mové o eliminá sus mesas antes de eliminar el espacio.");
    expect(
      describeVenueError(
        { kind: "conflict", code: "space_not_removable", reason: "last_space", tableCount: 0 },
        { type: "delete-space", id: "patio" },
        venue,
      ),
    ).toBe("El local necesita al menos un espacio.");
    expect(describeVenueError({ kind: "conflict", code: "table_has_history" }, { type: "delete-table", id: "tbl_01" }, venue)).toBe(
      "Mesa 01 tiene sesiones registradas: su historial se conserva, por eso no se puede eliminar.",
    );
    expect(describeVenueError({ kind: "conflict", code: "table_has_open_session" }, { type: "delete-table", id: "tbl_01" }, venue)).toBe(
      "Mesa 01 tiene una cuenta activa: no se puede eliminar ni deshabilitar hasta que se cierre.",
    );
    expect(
      describeVenueError({ kind: "conflict", code: "table_has_open_session" }, { type: "set-table-enabled", id: "tbl_01", enabled: false }, venue),
    ).toBe("No se puede deshabilitar mientras exista una cuenta activa.");
  });

  it("explains a configuration that changed elsewhere", () => {
    expect(describeVenueError({ kind: "not-found" }, move, venue)).toBe(
      "Esa mesa o espacio ya no existe. Recargá la página para ver la configuración actual.",
    );
  });
});

describe("issue copy", () => {
  it("maps table issues to the form messages", () => {
    expect(
      tableIssueErrors([
        { path: "label", code: "duplicate" },
        { path: "capacity", code: "out_of_range" },
        { path: "spaceId", code: "unknown_space" },
        { path: "description", code: "too_long" },
        { path: "other", code: "x" },
      ]),
    ).toEqual({
      label: "Ya existe una mesa con ese nombre.",
      capacity: "Ingresá un número entero entre 1 y 20.",
      spaceId: "Elegí un espacio.",
      description: "Usá hasta 60 caracteres.",
    });
    expect(tableIssueErrors([{ path: "label", code: "required" }])).toEqual({ label: "Ingresá el nombre o número de la mesa." });
    expect(tableIssueErrors([{ path: "label", code: "too_long" }])).toEqual({ label: "Usá hasta 30 caracteres." });
  });

  it("maps space issues to the name message", () => {
    expect(spaceIssueError([{ path: "name", code: "duplicate" }])).toBe("Ese espacio ya existe.");
    expect(spaceIssueError([{ path: "name", code: "required" }])).toBe("Ingresá el nombre del espacio.");
    expect(spaceIssueError([{ path: "name", code: "too_long" }])).toBe("Usá hasta 24 caracteres.");
    expect(spaceIssueError([])).toBeNull();
  });
});
