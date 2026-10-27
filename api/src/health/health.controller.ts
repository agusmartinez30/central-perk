import { Controller, Get } from '@nestjs/common';

/**
 * Liveness probe. It deliberately does not touch the database so the process
 * reports healthy while it can serve requests; a DB readiness probe can be added later.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
