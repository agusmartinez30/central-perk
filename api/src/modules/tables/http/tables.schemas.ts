import { z } from 'zod';
import { SPACE_ICONS, SPACE_TONES } from '../domain/space.js';
import { TABLE_SHAPES } from '../domain/table-layout.js';

/** Request shapes only. Business rules (name length, unique labels, capacity range, overlaps…) live in the domain. */

export const spaceSchema = z.object({
  name: z.string().max(200),
  icon: z.enum(SPACE_ICONS).optional(),
  tone: z.enum(SPACE_TONES).optional(),
});

export const moveSpaceSchema = z.object({ direction: z.enum(['up', 'down']) });

export const tableSchema = z.object({
  label: z.string().max(200),
  spaceId: z.string().max(100),
  capacity: z.number(),
  description: z.string().max(1000),
  enabled: z.boolean(),
});

export const newTableSchema = tableSchema.extend({ shape: z.enum(TABLE_SHAPES).optional() });

/** Plan units; the domain snaps and clamps to the 780×620 plan. */
const coordinate = z.number().min(-10_000).max(10_000);

export const positionSchema = z.object({ x: coordinate, y: coordinate });

export const sizeSchema = z.object({
  x: coordinate.int(),
  y: coordinate.int(),
  width: z.number().int().min(0).max(10_000),
  height: z.number().int().min(0).max(10_000),
});

export const shapeSchema = z.object({ shape: z.enum(TABLE_SHAPES) });

/** The QR URL carries `?mesa=07&qr=<token>`; the web passes them as `number` and `token`. */
export const resolveQrQuerySchema = z.object({
  number: z
    .string()
    .regex(/^\d{1,6}$/)
    .transform(Number),
  token: z.string().min(1).max(64),
});

export type SpaceBody = z.output<typeof spaceSchema>;
export type MoveSpaceBody = z.output<typeof moveSpaceSchema>;
export type TableBody = z.output<typeof tableSchema>;
export type NewTableBody = z.output<typeof newTableSchema>;
export type PositionBody = z.output<typeof positionSchema>;
export type SizeBody = z.output<typeof sizeSchema>;
export type ShapeBody = z.output<typeof shapeSchema>;
export type ResolveQrQuery = z.output<typeof resolveQrQuerySchema>;
