import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import {
  InvalidSpaceError,
  InvalidTableError,
  SpaceNotFoundError,
  SpaceNotRemovableError,
  TableNotFoundError,
  TableOverlapError,
  TablesError,
} from '../domain/tables-errors.js';

function statusOf(error: TablesError): HttpStatus {
  if (error instanceof SpaceNotFoundError || error instanceof TableNotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof InvalidSpaceError || error instanceof InvalidTableError) return HttpStatus.BAD_REQUEST;
  // The request is valid but the current configuration forbids it (tables left, open session, overlap…).
  return HttpStatus.CONFLICT;
}

/**
 * Maps tables domain errors to HTTP: `{ statusCode, error: <code>, message, ... }`. `400` carries
 * `issues: [{ path, code }]`; `409` carries `reason` + `tableCount` (space removal) or `conflict`
 * (overlap).
 */
@Catch(TablesError)
export class TablesErrorFilter implements ExceptionFilter<TablesError> {
  catch(error: TablesError, host: ArgumentsHost): void {
    const status = statusOf(error);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        error: error.code,
        message: error.message,
        ...(error instanceof InvalidSpaceError || error instanceof InvalidTableError ? { issues: error.issues } : {}),
        ...(error instanceof SpaceNotRemovableError ? { reason: error.reason, tableCount: error.tableCount } : {}),
        ...(error instanceof TableOverlapError ? { conflict: error.conflict } : {}),
      });
  }
}
