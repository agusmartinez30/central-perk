import { describe, expect, it } from "vitest";
import { toTableDraft } from "./table-config";
import { toTablesRequests } from "./venue-commands";
import { createVenueState } from "./venue-state";

const venue = createVenueState();
const mesa07 = venue.tables.find((table) => table.id === "tbl_07")!;

describe("toTablesRequests", () => {
  it("creates, edits, reorders and deletes spaces", () => {
    expect(toTablesRequests({ type: "save-space", editingId: null, name: " Barra ", icon: "sun", tone: "neutral" }, venue)).toEqual([
      { method: "POST", path: "/spaces", body: { name: "Barra", icon: "sun", tone: "neutral" } },
    ]);
    expect(toTablesRequests({ type: "save-space", editingId: "salon", name: "Salón principal" }, venue)).toEqual([
      { method: "PATCH", path: "/spaces/salon", body: { name: "Salón principal" } },
    ]);
    expect(toTablesRequests({ type: "move-space", id: "terraza", direction: -1 }, venue)).toEqual([
      { method: "POST", path: "/spaces/terraza/move", body: { direction: "up" } },
    ]);
    expect(toTablesRequests({ type: "move-space", id: "terraza", direction: 1 }, venue)[0].body).toEqual({ direction: "down" });
    expect(toTablesRequests({ type: "delete-space", id: "patio" }, venue)).toEqual([{ method: "DELETE", path: "/spaces/patio" }]);
  });

  it("creates a table with its shape; the server issues number, id and QR credential", () => {
    const draft = { label: " Mesa 13 ", spaceId: "terraza", capacity: " 6 ", description: " Barra ", enabled: true };
    expect(toTablesRequests({ type: "save-table", editingId: null, draft, shape: "round" }, venue)).toEqual([
      {
        method: "POST",
        path: "",
        body: { label: "Mesa 13", spaceId: "terraza", capacity: 6, description: "Barra", enabled: true, shape: "round" },
      },
    ]);
  });

  it("edits a table: only the changed parts are sent", () => {
    const draft = { ...toTableDraft(mesa07), capacity: "6" };
    expect(toTablesRequests({ type: "save-table", editingId: "tbl_07", draft, shape: "rect" }, venue)).toEqual([
      {
        method: "PATCH",
        path: "/tbl_07",
        body: { label: "Mesa 07", spaceId: mesa07.spaceId, capacity: 6, description: mesa07.description, enabled: true },
      },
    ]);
    expect(toTablesRequests({ type: "save-table", editingId: "tbl_07", draft: toTableDraft(mesa07), shape: "round" }, venue)).toEqual([
      { method: "PUT", path: "/tbl_07/shape", body: { shape: "round" } },
    ]);
    expect(toTablesRequests({ type: "save-table", editingId: "tbl_07", draft, shape: "round" }, venue).map((request) => request.method)).toEqual([
      "PATCH",
      "PUT",
    ]);
  });

  it("toggles, deletes, lays out and rotates the QR of a table", () => {
    expect(toTablesRequests({ type: "set-table-enabled", id: "tbl_07", enabled: false }, venue)).toEqual([
      { method: "POST", path: "/tbl_07/disable" },
    ]);
    expect(toTablesRequests({ type: "set-table-enabled", id: "tbl_07", enabled: true }, venue)).toEqual([
      { method: "POST", path: "/tbl_07/enable" },
    ]);
    expect(toTablesRequests({ type: "delete-table", id: "tbl_13" }, venue)).toEqual([{ method: "DELETE", path: "/tbl_13" }]);
    expect(toTablesRequests({ type: "move-table", id: "tbl_07", x: 37, y: 380 }, venue)).toEqual([
      { method: "PUT", path: "/tbl_07/position", body: { x: 37, y: 380 } },
    ]);
    expect(toTablesRequests({ type: "resize-table", id: "tbl_07", x: 38.4, y: 64, width: 184.6, height: 160 }, venue)).toEqual([
      { method: "PUT", path: "/tbl_07/size", body: { x: 38, y: 64, width: 185, height: 160 } },
    ]);
    expect(toTablesRequests({ type: "set-table-shape", id: "tbl_07", shape: "round" }, venue)).toEqual([
      { method: "PUT", path: "/tbl_07/shape", body: { shape: "round" } },
    ]);
    expect(toTablesRequests({ type: "regenerate-qr", id: "tbl_07" }, venue)).toEqual([{ method: "POST", path: "/tbl_07/qr/regenerate" }]);
  });

  it("encodes ids in the path", () => {
    expect(toTablesRequests({ type: "delete-space", id: "a/b" }, venue)).toEqual([{ method: "DELETE", path: "/spaces/a%2Fb" }]);
  });
});
