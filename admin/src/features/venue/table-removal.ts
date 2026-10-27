import type { ServiceDay, VenueTable } from "@/mocks/service-day";
import type { SessionStatus } from "./table-config";

/** Numbers of the tables that ever had a session (open or closed), sorted. */
export function getTableNumbersWithHistory(day: Pick<ServiceDay, "sessions">): number[] {
  return [...new Set(day.sessions.map((session) => session.tableNumber))].sort((a, b) => a - b);
}

/**
 * What "Eliminar mesa" can do (messages invented):
 * - `delete`: the table never had a session, so it and its QR can go;
 * - `disable`: its history must be kept, so it is offered to disable it instead;
 * - `blocked`: an open session forbids both (the 09B rule), or it is already disabled.
 */
export type TableRemoval = { kind: "delete" } | { kind: "disable"; reason: string } | { kind: "blocked"; reason: string };

export const openSessionReason = (label: string) =>
  `${label} tiene una cuenta activa: no se puede eliminar ni deshabilitar hasta que se cierre.`;

export const historyReason = (label: string) =>
  `${label} tiene sesiones registradas: su historial se conserva, por eso no se puede eliminar.`;

export function getTableRemoval(table: VenueTable, { hadSession, session }: { hadSession: boolean; session: SessionStatus }): TableRemoval {
  if (session !== "available") {
    return { kind: "blocked", reason: openSessionReason(table.label) };
  }
  if (!hadSession) return { kind: "delete" };
  const kept = historyReason(table.label);
  if (!table.enabled) return { kind: "blocked", reason: `${kept} Ya está deshabilitada.` };
  return { kind: "disable", reason: `${kept} Podés deshabilitarla para que no admita nuevas sesiones.` };
}

/** Removes the table and its credential; callers check `getTableRemoval` first. */
export function deleteTable(tables: readonly VenueTable[], id: string): readonly VenueTable[] {
  return tables.some((table) => table.id === id) ? tables.filter((table) => table.id !== id) : tables;
}
