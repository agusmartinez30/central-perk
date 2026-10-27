import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from '../../../shared/http/zod-validation.pipe.js';
import { CurrentStaff, SessionGuard } from '../../auth/http/session.guard.js';
import type { StaffProfile } from '../../auth/domain/staff-user.js';
import { RegenerateTableQr, ResolveTableQr } from '../application/qr.use-cases.js';
import { CreateSpace, DeleteSpace, MoveSpace, UpdateSpace } from '../application/spaces.use-cases.js';
import { MoveTable, ResizeTable, SetTableShape } from '../application/table-layout.use-cases.js';
import { CreateTable, DeleteTable, GetTablesConfiguration, SetTableEnabled, UpdateTable } from '../application/tables.use-cases.js';
import type { PublicTable, TablesConfiguration } from '../domain/tables-configuration.js';
import { TablesErrorFilter } from './tables-error.filter.js';
import {
  moveSpaceSchema,
  newTableSchema,
  positionSchema,
  resolveQrQuerySchema,
  shapeSchema,
  sizeSchema,
  spaceSchema,
  tableSchema,
  type MoveSpaceBody,
  type NewTableBody,
  type PositionBody,
  type ResolveQrQuery,
  type ShapeBody,
  type SizeBody,
  type SpaceBody,
  type TableBody,
} from './tables.schemas.js';

/** Public: resolves a scanned QR for the web app. */
@Controller('tables')
@UseFilters(TablesErrorFilter)
export class TableQrController {
  constructor(private readonly resolveQr: ResolveTableQr) {}

  @Get('qr')
  resolve(@Query(new ZodValidationPipe(resolveQrQuerySchema)) query: ResolveQrQuery): Promise<PublicTable> {
    return this.resolveQr.execute(query);
  }
}

/** Admin table configuration. Every mutation answers the full updated `{ spaces, tables }`. */
@Controller('tables')
@UseGuards(SessionGuard)
@UseFilters(TablesErrorFilter)
export class TablesConfigController {
  constructor(
    private readonly getConfiguration: GetTablesConfiguration,
    private readonly createSpace: CreateSpace,
    private readonly updateSpace: UpdateSpace,
    private readonly moveSpace: MoveSpace,
    private readonly deleteSpace: DeleteSpace,
    private readonly createTable: CreateTable,
    private readonly updateTable: UpdateTable,
    private readonly setTableEnabled: SetTableEnabled,
    private readonly deleteTable: DeleteTable,
    private readonly moveTable: MoveTable,
    private readonly resizeTable: ResizeTable,
    private readonly setTableShape: SetTableShape,
    private readonly regenerateQr: RegenerateTableQr,
  ) {}

  @Get('config')
  configuration(): Promise<TablesConfiguration> {
    return this.getConfiguration.execute();
  }

  // Spaces

  @Post('spaces')
  addSpace(@Body(new ZodValidationPipe(spaceSchema)) body: SpaceBody): Promise<TablesConfiguration> {
    return this.createSpace.execute(body);
  }

  @Patch('spaces/:spaceId')
  editSpace(@Param('spaceId') id: string, @Body(new ZodValidationPipe(spaceSchema)) body: SpaceBody): Promise<TablesConfiguration> {
    return this.updateSpace.execute(id, body);
  }

  @Post('spaces/:spaceId/move')
  @HttpCode(200)
  reorderSpace(
    @Param('spaceId') id: string,
    @Body(new ZodValidationPipe(moveSpaceSchema)) body: MoveSpaceBody,
  ): Promise<TablesConfiguration> {
    return this.moveSpace.execute(id, body.direction);
  }

  @Delete('spaces/:spaceId')
  removeSpace(@Param('spaceId') id: string): Promise<TablesConfiguration> {
    return this.deleteSpace.execute(id);
  }

  // Tables

  @Post()
  addTable(
    @Body(new ZodValidationPipe(newTableSchema)) body: NewTableBody,
    @CurrentStaff() staff: StaffProfile,
  ): Promise<TablesConfiguration> {
    return this.createTable.execute(body, staff);
  }

  @Patch(':tableId')
  editTable(@Param('tableId') id: string, @Body(new ZodValidationPipe(tableSchema)) body: TableBody): Promise<TablesConfiguration> {
    return this.updateTable.execute(id, body);
  }

  @Post(':tableId/enable')
  @HttpCode(200)
  enable(@Param('tableId') id: string): Promise<TablesConfiguration> {
    return this.setTableEnabled.execute(id, true);
  }

  @Post(':tableId/disable')
  @HttpCode(200)
  disable(@Param('tableId') id: string): Promise<TablesConfiguration> {
    return this.setTableEnabled.execute(id, false);
  }

  @Delete(':tableId')
  removeTable(@Param('tableId') id: string): Promise<TablesConfiguration> {
    return this.deleteTable.execute(id);
  }

  // Floor plan

  @Put(':tableId/position')
  position(@Param('tableId') id: string, @Body(new ZodValidationPipe(positionSchema)) body: PositionBody): Promise<TablesConfiguration> {
    return this.moveTable.execute(id, body);
  }

  @Put(':tableId/size')
  size(@Param('tableId') id: string, @Body(new ZodValidationPipe(sizeSchema)) body: SizeBody): Promise<TablesConfiguration> {
    return this.resizeTable.execute(id, body);
  }

  @Put(':tableId/shape')
  shape(@Param('tableId') id: string, @Body(new ZodValidationPipe(shapeSchema)) body: ShapeBody): Promise<TablesConfiguration> {
    return this.setTableShape.execute(id, body.shape);
  }

  // QR

  @Post(':tableId/qr/regenerate')
  @HttpCode(200)
  regenerate(@Param('tableId') id: string, @CurrentStaff() staff: StaffProfile): Promise<TablesConfiguration> {
    return this.regenerateQr.execute(id, staff);
  }
}
