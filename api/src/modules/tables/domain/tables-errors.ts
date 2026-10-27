import type { SpaceIssue, SpaceRemovalBlock } from './space.js';
import type { TableIssue } from './table.js';

export abstract class TablesError extends Error {
  abstract readonly code: string;
}

export class SpaceNotFoundError extends TablesError {
  readonly code = 'space_not_found';
  constructor() {
    super('Space not found');
  }
}

/** Unknown table, or a QR that does not resolve (no reason given to the public). */
export class TableNotFoundError extends TablesError {
  readonly code = 'table_not_found';
  constructor() {
    super('Table not found');
  }
}

export class InvalidSpaceError extends TablesError {
  readonly code = 'invalid_space';
  constructor(readonly issues: SpaceIssue[]) {
    super('Space does not meet the rules');
  }
}

export class InvalidTableError extends TablesError {
  readonly code = 'invalid_table';
  constructor(readonly issues: TableIssue[]) {
    super('Table does not meet the rules');
  }
}

/** The space still has tables, or it is the last one. */
export class SpaceNotRemovableError extends TablesError {
  readonly code = 'space_not_removable';
  constructor(
    readonly reason: SpaceRemovalBlock,
    readonly tableCount: number,
  ) {
    super(reason === 'last_space' ? 'The venue needs at least one space' : 'Move or delete the tables of the space first');
  }
}

/** Disabling or deleting a table while a session is open. */
export class TableHasOpenSessionError extends TablesError {
  readonly code = 'table_has_open_session';
  constructor() {
    super('The table has an open session');
  }
}

/** Deleting a table that had sessions: its history is kept, so it can only be disabled. */
export class TableHasHistoryError extends TablesError {
  readonly code = 'table_has_history';
  constructor() {
    super('The table has session history; disable it instead');
  }
}

export class TableOverlapError extends TablesError {
  readonly code = 'table_overlap';
  constructor(readonly conflict: { id: string; number: number; label: string }) {
    super('The table would overlap another table of its space');
  }
}
