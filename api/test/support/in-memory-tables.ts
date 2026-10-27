import type { TablesDeps } from '../../src/modules/tables/application/tables-deps.js';
import type { QrCredential, RevokedQrCredential } from '../../src/modules/tables/domain/qr-credential.js';
import type { Space } from '../../src/modules/tables/domain/space.js';
import type { TableActivitySnapshot, VenueTable } from '../../src/modules/tables/domain/table.js';
import type {
  QrTokenGenerator,
  TableActivity,
  TablesConfiguration,
  TablesRepository,
} from '../../src/modules/tables/domain/tables-configuration.js';
import { FakeClock } from './in-memory-auth.js';

/** In-memory adapters for the tables ports, shared by unit specs and the HTTP e2e test. */

type StoredCredential = (QrCredential | RevokedQrCredential) & { tableNumber: number };

export class InMemoryTables implements TablesRepository {
  spaces: Space[] = [];
  tables: VenueTable[] = [];
  /** Credentials of deleted tables, kept so tokens and numbers are never reused. */
  retired: StoredCredential[] = [];

  constructor(config?: TablesConfiguration) {
    if (config) this.reset(config);
  }

  reset(config: TablesConfiguration): void {
    this.spaces = structuredClone(config.spaces);
    this.tables = structuredClone(config.tables);
    this.retired = [];
  }

  load(): Promise<TablesConfiguration> {
    const tables = [...this.tables].sort((a, b) => a.number - b.number);
    return Promise.resolve(structuredClone({ spaces: this.spaces, tables }));
  }

  saveSpaces(spaces: readonly Space[]): Promise<void> {
    this.spaces = structuredClone([...spaces]);
    return Promise.resolve();
  }

  saveTable(table: VenueTable): Promise<void> {
    const copy = structuredClone(table);
    const index = this.tables.findIndex((candidate) => candidate.id === table.id);
    if (index < 0) this.tables.push(copy);
    else this.tables[index] = copy;
    return Promise.resolve();
  }

  deleteTable(id: string, revokedAt: Date): Promise<void> {
    const table = this.tables.find((candidate) => candidate.id === id);
    if (table) {
      if (table.qr) this.retired.push({ ...table.qr, tableNumber: table.number, revokedAt });
      this.retired.push(...table.revokedQrs.map((credential) => ({ ...credential, tableNumber: table.number })));
      this.tables = this.tables.filter((candidate) => candidate.id !== id);
    }
    return Promise.resolve();
  }

  highestTableNumber(): Promise<number> {
    const numbers = [...this.tables.map((table) => table.number), ...this.retired.map((credential) => credential.tableNumber)];
    return Promise.resolve(Math.max(0, ...numbers));
  }

  highestAuditNumber(): Promise<number> {
    const numbers = [...this.tables.flatMap((table) => table.revokedQrs), ...this.retired].map((credential) =>
      'auditNumber' in credential && typeof credential.auditNumber === 'number' ? credential.auditNumber : 0,
    );
    return Promise.resolve(Math.max(0, ...numbers));
  }

  isTokenTaken(token: string): Promise<boolean> {
    const tokens = [
      ...this.tables.flatMap((table) => [...(table.qr ? [table.qr.token] : []), ...table.revokedQrs.map((credential) => credential.token)]),
      ...this.retired.map((credential) => credential.token),
    ];
    return Promise.resolve(tokens.includes(token));
  }
}

/** Reports the activity set per table id; tables without an entry have none. */
export class FakeTableActivity implements TableActivity {
  readonly byTable = new Map<string, TableActivitySnapshot>();

  activityOf(tableId: string): Promise<TableActivitySnapshot> {
    return Promise.resolve(this.byTable.get(tableId) ?? { openSession: false, hadSession: false });
  }
}

/** Hands out the queued tokens in order, then `TOKEN0001`, `TOKEN0002`, … */
export class SequenceTokenGenerator implements QrTokenGenerator {
  private counter = 0;
  readonly queue: string[] = [];

  generate(): string {
    const queued = this.queue.shift();
    if (queued) return queued;
    this.counter += 1;
    return `TOKEN${String(this.counter).padStart(5, '0')}`;
  }
}

export const STAFF = { id: 'staff-1', name: 'Sofía M.' };

const ISSUED_AT = new Date('2026-10-21T12:00:00Z');

function table(number: number, spaceId: string, x: number, y: number, overrides: Partial<VenueTable> = {}): VenueTable {
  const padded = String(number).padStart(2, '0');
  return {
    id: `tbl_${padded}`,
    number,
    label: `Mesa ${padded}`,
    spaceId,
    capacity: 4,
    description: '',
    enabled: true,
    version: 1,
    layout: { x, y, width: 150, height: 132, shape: 'rect' },
    qr: { token: `Tok${padded}abcde`, issuedAt: ISSUED_AT, issuedBy: STAFF },
    revokedQrs: [],
    ...overrides,
  };
}

/** Two spaces: Salón with Mesa 01 and 02 side by side, Terraza with Mesa 03; Mesa 02 has one audited rotation (#118). */
export function tablesConfiguration(): TablesConfiguration {
  return {
    spaces: [
      { id: 'salon', name: 'Salón', icon: 'store', tone: 'brand' },
      { id: 'terraza', name: 'Terraza', icon: 'sun', tone: 'warning' },
    ],
    tables: [
      table(1, 'salon', 38, 64, { capacity: 2 }),
      table(2, 'salon', 222, 64, {
        version: 18,
        revokedQrs: [
          {
            token: 'Old02abcde',
            issuedAt: new Date('2026-03-02T12:00:00Z'),
            issuedBy: STAFF,
            revokedAt: ISSUED_AT,
            auditNumber: 118,
          },
        ],
      }),
      table(3, 'terraza', 38, 64),
    ],
  };
}

export function createTablesDeps(config: TablesConfiguration = tablesConfiguration()) {
  return {
    tables: new InMemoryTables(config),
    activity: new FakeTableActivity(),
    tokens: new SequenceTokenGenerator(),
    clock: new FakeClock(),
  } satisfies TablesDeps;
}
