import type { StaffRef } from '../domain/qr-credential.js';
import { QR_TOKEN_LENGTH, type QrCredential } from '../domain/qr-credential.js';
import type { VenueTable } from '../domain/table.js';
import type { QrTokenGenerator, TableActivity, TablesConfiguration, TablesRepository } from '../domain/tables-configuration.js';
import { TableNotFoundError } from '../domain/tables-errors.js';

export interface Clock {
  now(): Date;
}

/** Everything the tables use cases need, wired by `TablesModule` or by test fakes. */
export interface TablesDeps {
  tables: TablesRepository;
  activity: TableActivity;
  tokens: QrTokenGenerator;
  clock: Clock;
}

export function findTable(config: TablesConfiguration, id: string): VenueTable {
  const table = config.tables.find((candidate) => candidate.id === id);
  if (!table) throw new TableNotFoundError();
  return table;
}

/** Generous for 62^10 tokens; reaching it means the generator is broken. */
const MAX_TOKEN_ATTEMPTS = 8;

/** A credential with a token no credential ever carried, issued now by `staff`. */
export async function issueCredential(deps: TablesDeps, staff: StaffRef): Promise<QrCredential> {
  for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt += 1) {
    const token = deps.tokens.generate();
    if (token.length !== QR_TOKEN_LENGTH) throw new Error(`QR token generator returned ${token.length} characters`);
    if (!(await deps.tables.isTokenTaken(token))) {
      return { token, issuedAt: deps.clock.now(), issuedBy: { id: staff.id, name: staff.name } };
    }
  }
  throw new Error('Could not generate an unused QR token');
}
