import { Injectable } from '@nestjs/common';
import type {
  SpaceIcon as SpaceIconRow,
  SpaceTone as SpaceToneRow,
  TableShape as TableShapeRow,
} from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import type { QrCredential, RevokedQrCredential } from '../domain/qr-credential.js';
import type { Space, SpaceIcon, SpaceTone } from '../domain/space.js';
import type { VenueTable } from '../domain/table.js';
import type { TableShape } from '../domain/table-layout.js';
import type { TablesConfiguration, TablesRepository } from '../domain/tables-configuration.js';

/** Prisma enum values are the uppercase form of the domain identifiers ("map-pin" ↔ "MAP_PIN"). */
export const toRow = <Row extends string>(value: string) => value.toUpperCase().replace(/-/g, '_') as Row;
const fromRow = <Value extends string>(row: string) => row.toLowerCase().replace(/_/g, '-') as Value;

const ISSUER = { select: { id: true, name: true } } as const;

@Injectable()
export class PrismaTablesRepository implements TablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<TablesConfiguration> {
    const [spaces, tables] = await Promise.all([
      this.prisma.venueSpace.findMany({ orderBy: { position: 'asc' } }),
      this.prisma.venueTable.findMany({
        orderBy: { number: 'asc' },
        include: { credentials: { include: { issuedBy: ISSUER } } },
      }),
    ]);
    return {
      spaces: spaces.map((space) => ({
        id: space.id,
        name: space.name,
        icon: fromRow<SpaceIcon>(space.icon),
        tone: fromRow<SpaceTone>(space.tone),
      })),
      tables: tables.map((row) => {
        const credential = (stored: (typeof row.credentials)[number]): QrCredential => ({
          token: stored.token,
          issuedAt: stored.issuedAt,
          issuedBy: stored.issuedBy,
        });
        const active = row.credentials.find((stored) => stored.revokedAt === null);
        const revokedQrs: RevokedQrCredential[] = row.credentials
          .filter((stored) => stored.revokedAt !== null)
          .map((stored) => ({ ...credential(stored), revokedAt: stored.revokedAt ?? stored.issuedAt, auditNumber: stored.auditNumber ?? 0 }))
          .sort((a, b) => b.revokedAt.getTime() - a.revokedAt.getTime() || b.auditNumber - a.auditNumber);
        return {
          id: row.id,
          number: row.number,
          label: row.label,
          spaceId: row.spaceId,
          capacity: row.capacity,
          description: row.description,
          enabled: row.enabled,
          version: row.version,
          layout: {
            x: row.layoutX,
            y: row.layoutY,
            width: row.layoutWidth,
            height: row.layoutHeight,
            shape: fromRow<TableShape>(row.layoutShape),
          },
          qr: active ? credential(active) : null,
          revokedQrs,
        };
      }),
    };
  }

  async saveSpaces(spaces: readonly Space[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.venueSpace.deleteMany({ where: { id: { notIn: spaces.map((space) => space.id) } } }),
      ...spaces.map((space, position) => {
        const fields = { name: space.name, icon: toRow<SpaceIconRow>(space.icon), tone: toRow<SpaceToneRow>(space.tone), position };
        return this.prisma.venueSpace.upsert({ where: { id: space.id }, create: { id: space.id, ...fields }, update: fields });
      }),
    ]);
  }

  async saveTable(table: VenueTable): Promise<void> {
    const fields = {
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
      layoutShape: toRow<TableShapeRow>(table.layout.shape),
    };
    // Revoke first so the table never has two active credentials, even mid-transaction.
    const credentials: (QrCredential & Partial<RevokedQrCredential>)[] = [...table.revokedQrs, ...(table.qr ? [table.qr] : [])];
    await this.prisma.$transaction([
      this.prisma.venueTable.upsert({
        where: { id: table.id },
        create: { id: table.id, number: table.number, ...fields },
        update: fields,
      }),
      ...credentials.map((credential) => {
        const revocation = { revokedAt: credential.revokedAt ?? null, auditNumber: credential.auditNumber ?? null };
        return this.prisma.tableQrCredential.upsert({
          where: { token: credential.token },
          create: {
            token: credential.token,
            tableId: table.id,
            tableNumber: table.number,
            issuedAt: credential.issuedAt,
            issuedById: credential.issuedBy.id,
            ...revocation,
          },
          update: revocation,
        });
      }),
    ]);
  }

  async deleteTable(id: string, revokedAt: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.tableQrCredential.updateMany({ where: { tableId: id, revokedAt: null }, data: { revokedAt } }),
      // Credentials keep their token and table number; `tableId` becomes null.
      this.prisma.venueTable.delete({ where: { id } }),
    ]);
  }

  async highestTableNumber(): Promise<number> {
    const [tables, credentials] = await Promise.all([
      this.prisma.venueTable.aggregate({ _max: { number: true } }),
      this.prisma.tableQrCredential.aggregate({ _max: { tableNumber: true } }),
    ]);
    return Math.max(tables._max.number ?? 0, credentials._max.tableNumber ?? 0);
  }

  async highestAuditNumber(): Promise<number> {
    const { _max } = await this.prisma.tableQrCredential.aggregate({ _max: { auditNumber: true } });
    return _max.auditNumber ?? 0;
  }

  async isTokenTaken(token: string): Promise<boolean> {
    return (await this.prisma.tableQrCredential.count({ where: { token } })) > 0;
  }
}
