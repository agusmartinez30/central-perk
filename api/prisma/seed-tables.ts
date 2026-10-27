import type { PrismaClient } from '../src/generated/prisma/client.js';
import type { QrCredential, RevokedQrCredential } from '../src/modules/tables/domain/qr-credential.js';
import { spaceNameIssues, type Space } from '../src/modules/tables/domain/space.js';
import { tableDraftIssues, tableIdFor, type VenueTable } from '../src/modules/tables/domain/table.js';
import { boxesOverlap, clampToPlan, getMinTableSize } from '../src/modules/tables/domain/table-layout.js';
import { toRow } from '../src/modules/tables/infrastructure/prisma-tables.repository.js';

/**
 * Sample configuration from the admin mock (`admin/src/mocks/service-day/tables.ts`): three
 * spaces and the twelve tables of the 02 plan with their fixed QR tokens, so printed codes stay
 * stable. Every credential is attributed to the seeded owner.
 */
export const SEED_SPACES: Space[] = [
  { id: 'salon', name: 'Salón', icon: 'store', tone: 'brand' },
  { id: 'terraza', name: 'Terraza', icon: 'sun', tone: 'warning' },
  { id: 'patio', name: 'Patio', icon: 'trees', tone: 'success' },
];

type TableSeed = { number: number; spaceId: string; capacity: number; version: number; token: string; issuedOn: string; description?: string };

const SEEDS: TableSeed[] = [
  { number: 1, spaceId: 'salon', capacity: 2, version: 4, token: 'Hq3vN8tWc2', issuedOn: '2026-03-02' },
  { number: 2, spaceId: 'salon', capacity: 4, version: 3, token: 'bR7mK2xPq9', issuedOn: '2026-03-02' },
  { number: 3, spaceId: 'salon', capacity: 4, version: 5, token: 'Tz4cY9gLw6', issuedOn: '2026-03-02' },
  { number: 4, spaceId: 'salon', capacity: 2, version: 3, token: 'pM8sD3fRk5', issuedOn: '2026-03-02' },
  { number: 5, spaceId: 'terraza', capacity: 4, version: 6, token: 'Wn2jX7hBv4', issuedOn: '2026-04-15' },
  { number: 6, spaceId: 'terraza', capacity: 2, version: 4, token: 'cK9tQ5zMe3', issuedOn: '2026-04-15' },
  { number: 7, spaceId: 'salon', capacity: 4, version: 18, token: '4pX9kR2mL7', issuedOn: '2026-10-21', description: 'Cerca de la ventana' },
  { number: 8, spaceId: 'terraza', capacity: 6, version: 5, token: 'Ry6dG2wNs8', issuedOn: '2026-04-15' },
  { number: 9, spaceId: 'patio', capacity: 4, version: 2, token: 'Lf3bV8qTy7', issuedOn: '2026-05-20' },
  { number: 10, spaceId: 'patio', capacity: 6, version: 3, token: 'Ue5nH9rCx2', issuedOn: '2026-05-20' },
  { number: 11, spaceId: 'patio', capacity: 4, version: 2, token: 'gJ7wP4kZa6', issuedOn: '2026-05-20' },
  { number: 12, spaceId: 'patio', capacity: 2, version: 2, token: 'Xa8eS3mDu5', issuedOn: '2026-05-20' },
];

/** Mesa 07's previous code, rotated on 2026-10-21 (admin 09C "auditoría #QR-118"). */
const MESA_07_REVOKED = { token: 'Ma2rB6vKe9', issuedOn: '2026-03-02', revokedOn: '2026-10-21', auditNumber: 118 };

const PLAN_COLUMNS = [38, 222, 406, 590];
const PLAN_ROWS = [64, 236, 408];

/** Noon in Córdoba, so the date reads the same in the venue's time zone. */
const onDay = (isoDate: string) => new Date(`${isoDate}T12:00:00-03:00`);

export function seedTables(owner: { id: string; name: string }): VenueTable[] {
  return SEEDS.map((seed) => ({
    id: tableIdFor(seed.number),
    number: seed.number,
    label: `Mesa ${String(seed.number).padStart(2, '0')}`,
    spaceId: seed.spaceId,
    capacity: seed.capacity,
    description: seed.description ?? '',
    enabled: true,
    version: seed.version,
    layout: {
      x: PLAN_COLUMNS[(seed.number - 1) % 4] ?? 0,
      y: PLAN_ROWS[Math.floor((seed.number - 1) / 4)] ?? 0,
      // The six-seat Terraza table is a longer rectangle; Patio tables are round.
      width: seed.number === 8 ? 184 : 150,
      height: 132,
      shape: seed.spaceId === 'patio' ? 'round' : 'rect',
    },
    qr: { token: seed.token, issuedAt: onDay(seed.issuedOn), issuedBy: owner },
    revokedQrs:
      seed.number === 7
        ? [
            {
              token: MESA_07_REVOKED.token,
              issuedAt: onDay(MESA_07_REVOKED.issuedOn),
              issuedBy: owner,
              revokedAt: onDay(MESA_07_REVOKED.revokedOn),
              auditNumber: MESA_07_REVOKED.auditNumber,
            },
          ]
        : [],
  }));
}

/** Problems of the sample data against the domain rules; empty when it is valid. */
export function seedTablesIssues(spaces: Space[], tables: VenueTable[]): string[] {
  const issues: string[] = [];
  for (const space of spaces) {
    if (spaceNameIssues(space.name, spaces, space.id).length > 0) issues.push(`space ${space.id}: name`);
  }
  for (const table of tables) {
    const draftIssues = tableDraftIssues(table, { spaces, tables }, table.id);
    if (draftIssues.length > 0) issues.push(`table ${table.number}: ${JSON.stringify(draftIssues)}`);
    const { x, y, width, height } = table.layout;
    const min = getMinTableSize(table.capacity);
    const inside = clampToPlan({ x, y }, { width, height });
    if (inside.x !== x || inside.y !== y || width < min.width || height < min.height) issues.push(`table ${table.number}: layout`);
    const overlap = tables.find((other) => other.id !== table.id && other.spaceId === table.spaceId && boxesOverlap(other.layout, table.layout));
    if (overlap) issues.push(`table ${table.number}: overlaps ${overlap.number}`);
  }
  return issues;
}

const credentialsOf = (table: VenueTable): (QrCredential & Partial<RevokedQrCredential>)[] => [
  ...table.revokedQrs,
  ...(table.qr ? [table.qr] : []),
];

/**
 * Creates the sample spaces and tables only when the venue has no table configuration yet, so a
 * re-seed never brings back deleted tables or overwrites admin edits. Returns whether it seeded.
 */
export async function seedTablesConfiguration(prisma: PrismaClient, owner: { id: string; name: string }): Promise<boolean> {
  const tables = seedTables(owner);
  const issues = seedTablesIssues(SEED_SPACES, tables);
  if (issues.length > 0) throw new Error(`Seed tables are invalid: ${issues.join('; ')}`);

  const existing = (await prisma.venueSpace.count()) + (await prisma.venueTable.count()) + (await prisma.tableQrCredential.count());
  if (existing > 0) return false;

  await prisma.$transaction([
    prisma.venueSpace.createMany({
      data: SEED_SPACES.map((space, position) => ({ ...space, icon: toRow(space.icon), tone: toRow(space.tone), position })),
    }),
    ...tables.map((table) =>
      prisma.venueTable.create({
        data: {
          id: table.id,
          number: table.number,
          label: table.label,
          spaceId: table.spaceId,
          capacity: table.capacity,
          description: table.description,
          enabled: table.enabled,
          version: table.version,
          layoutX: table.layout.x,
          layoutY: table.layout.y,
          layoutWidth: table.layout.width,
          layoutHeight: table.layout.height,
          layoutShape: toRow(table.layout.shape),
          credentials: {
            create: credentialsOf(table).map((credential) => ({
              token: credential.token,
              tableNumber: table.number,
              issuedAt: credential.issuedAt,
              issuedById: credential.issuedBy.id,
              revokedAt: credential.revokedAt ?? null,
              auditNumber: credential.auditNumber ?? null,
            })),
          },
        },
      }),
    ),
  ]);
  return true;
}
