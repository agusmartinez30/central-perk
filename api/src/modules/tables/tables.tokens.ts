/** Nest DI tokens for the tables ports, so tests can override any adapter. */
export const TABLES_DEPS = Symbol('TABLES_DEPS');
export const TABLES_REPOSITORY = Symbol('TABLES_REPOSITORY');
export const TABLE_ACTIVITY = Symbol('TABLE_ACTIVITY');
export const QR_TOKEN_GENERATOR = Symbol('QR_TOKEN_GENERATOR');
