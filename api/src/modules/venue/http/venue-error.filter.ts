import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { InvalidPaymentSettingsError, InvalidVenueProfileError, VenueError, VenueNotConfiguredError } from '../domain/venue-errors.js';

/**
 * Maps venue domain errors to HTTP: `{ statusCode, error: <code>, message, ... }`, with `issues`
 * (and `bankAccount` field codes for payment settings) on `400`.
 */
@Catch(VenueError)
export class VenueErrorFilter implements ExceptionFilter<VenueError> {
  catch(error: VenueError, host: ArgumentsHost): void {
    const status = error instanceof VenueNotConfiguredError ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        error: error.code,
        message: error.message,
        ...(error instanceof InvalidVenueProfileError ? { issues: error.issues } : {}),
        ...(error instanceof InvalidPaymentSettingsError ? { issues: error.issues, bankAccount: error.bankAccount } : {}),
      });
  }
}
