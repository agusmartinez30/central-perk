import { describe, expect, it } from 'vitest';
import {
  boxesOverlap,
  clampToPlan,
  getFreeLayout,
  getMinTableSize,
  getSeatsBySide,
  PLAN_SIZE,
  resolveMove,
  resolveResize,
  snapToGrid,
  type PlacedTable,
  type TableLayout,
} from './table-layout.js';

const BOX = { width: 150, height: 132 };
const at = (x: number, y: number, width = 150, height = 132): TableLayout => ({ x, y, width, height, shape: 'rect' });
const placed = (id: string, spaceId: string, layout: TableLayout, capacity = 4): PlacedTable & { capacity: number } => ({
  id,
  spaceId,
  layout,
  capacity,
});

const mesa01 = placed('tbl_01', 'salon', at(38, 64), 2);
const mesa05 = placed('tbl_05', 'terraza', at(38, 236));
const tables = [
  mesa01,
  placed('tbl_02', 'salon', at(222, 64)),
  placed('tbl_03', 'salon', at(406, 64)),
  placed('tbl_04', 'salon', at(590, 64)),
  mesa05,
];

describe('table layout', () => {
  it('snaps to the 8px grid and keeps the whole box inside the plan', () => {
    expect(snapToGrid(38)).toBe(40);
    expect(snapToGrid(35.9)).toBe(32);
    expect(clampToPlan({ x: -40, y: 12 }, BOX)).toEqual({ x: 0, y: 12 });
    expect(clampToPlan({ x: 9999, y: 9999 }, BOX)).toEqual({ x: PLAN_SIZE.width - 150, y: PLAN_SIZE.height - 132 });
  });

  it('detects overlapping boxes; touching edges do not overlap', () => {
    expect(boxesOverlap(at(0, 0), at(149, 131))).toBe(true);
    expect(boxesOverlap(at(0, 0), at(150, 0))).toBe(false);
    expect(boxesOverlap(at(0, 0), at(0, 132))).toBe(false);
  });

  it('never lets a table shrink below the room its chairs need', () => {
    expect(getSeatsBySide(6)).toEqual({ top: 2, bottom: 2, left: 1, right: 1 });
    expect(getMinTableSize(2)).toEqual({ width: 96, height: 88 });
    expect(getMinTableSize(4)).toEqual({ width: 96, height: 88 });
    expect(getMinTableSize(6)).toEqual({ width: 120, height: 88 });
    expect(getMinTableSize(8)).toEqual({ width: 120, height: 96 });
  });

  it('places a new table in the first free cell of its space, row by row', () => {
    expect(getFreeLayout(tables, 'salon')).toEqual({ x: 38, y: 236, shape: 'rect', ...BOX });
    expect(getFreeLayout(tables, 'barra')).toEqual({ x: 38, y: 64, shape: 'rect', ...BOX });
  });

  it('falls back to any free grid spot, then to the top-left cell', () => {
    // Overlaps every grid column but leaves a strip on the left.
    const wide = [placed('wide', 'salon', at(160, 0, 460, PLAN_SIZE.height))];
    expect(getFreeLayout(wide, 'salon')).toEqual({ x: 0, y: 0, shape: 'rect', ...BOX });
    const full = [placed('all', 'salon', at(0, 0, PLAN_SIZE.width, PLAN_SIZE.height))];
    expect(getFreeLayout(full, 'salon')).toEqual({ x: 38, y: 64, shape: 'rect', ...BOX });
  });

  it('snaps and clamps a dropped table', () => {
    expect(resolveMove(tables, mesa01, { x: -13, y: 5 })).toEqual({ ok: true, layout: at(0, 8) });
  });

  it('refuses a drop over another table of the same space and names it', () => {
    const result = resolveMove(tables, mesa01, { x: 222, y: 64 });
    expect(result).toMatchObject({ ok: false, conflict: { id: 'tbl_02' } });
  });

  it('ignores tables of other spaces and the moved table itself', () => {
    expect(resolveMove(tables, mesa01, { x: 40, y: 236 }).ok).toBe(true);
    expect(resolveMove(tables, mesa01, { x: 40, y: 64 }).ok).toBe(true);
  });

  it('resizes to at least the chairs minimum, inside the plan, and refuses overlaps', () => {
    expect(resolveResize(tables, mesa01, { x: 38, y: 64, width: 10, height: 10 })).toEqual({ ok: true, layout: at(38, 64, 96, 88) });
    expect(resolveResize(tables, mesa05, { x: 700, y: 236, width: 300.4, height: 132 })).toEqual({
      ok: true,
      layout: at(PLAN_SIZE.width - 300, 236, 300, 132),
    });
    expect(resolveResize(tables, mesa01, { x: 38, y: 64, width: 200, height: 132 })).toMatchObject({
      ok: false,
      conflict: { id: 'tbl_02' },
    });
  });
});
