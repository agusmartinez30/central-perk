import {
  createSpaceId,
  DEFAULT_SPACE_STYLE,
  moveSpace,
  spaceNameIssues,
  spaceRemovalBlock,
  type SpaceDirection,
  type SpaceDraft,
} from '../domain/space.js';
import type { TablesConfiguration } from '../domain/tables-configuration.js';
import { InvalidSpaceError, SpaceNotFoundError, SpaceNotRemovableError } from '../domain/tables-errors.js';
import type { TablesDeps } from './tables-deps.js';

/** Adds a space at the end, with the default style unless one is chosen. */
export class CreateSpace {
  constructor(private readonly deps: TablesDeps) {}

  async execute(draft: SpaceDraft): Promise<TablesConfiguration> {
    const { spaces } = await this.deps.tables.load();
    const issues = spaceNameIssues(draft.name, spaces, null);
    if (issues.length > 0) throw new InvalidSpaceError(issues);
    const name = draft.name.trim();
    const space = {
      id: createSpaceId(name, spaces),
      name,
      icon: draft.icon ?? DEFAULT_SPACE_STYLE.icon,
      tone: draft.tone ?? DEFAULT_SPACE_STYLE.tone,
    };
    await this.deps.tables.saveSpaces([...spaces, space]);
    return this.deps.tables.load();
  }
}

/** Renames a space keeping its id; the icon or tone not given stays. */
export class UpdateSpace {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, draft: SpaceDraft): Promise<TablesConfiguration> {
    const { spaces } = await this.deps.tables.load();
    const current = spaces.find((space) => space.id === id);
    if (!current) throw new SpaceNotFoundError();
    const issues = spaceNameIssues(draft.name, spaces, id);
    if (issues.length > 0) throw new InvalidSpaceError(issues);
    const updated = { ...current, name: draft.name.trim(), icon: draft.icon ?? current.icon, tone: draft.tone ?? current.tone };
    await this.deps.tables.saveSpaces(spaces.map((space) => (space.id === id ? updated : space)));
    return this.deps.tables.load();
  }
}

/** Moves a space one place in the tabs and filters; nothing changes at either end. */
export class MoveSpace {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string, direction: SpaceDirection): Promise<TablesConfiguration> {
    const config = await this.deps.tables.load();
    if (!config.spaces.some((space) => space.id === id)) throw new SpaceNotFoundError();
    const spaces = moveSpace(config.spaces, id, direction);
    if (spaces === config.spaces) return config;
    await this.deps.tables.saveSpaces(spaces);
    return this.deps.tables.load();
  }
}

/** Deletes a space without tables, unless it is the last one. */
export class DeleteSpace {
  constructor(private readonly deps: TablesDeps) {}

  async execute(id: string): Promise<TablesConfiguration> {
    const { spaces, tables } = await this.deps.tables.load();
    if (!spaces.some((space) => space.id === id)) throw new SpaceNotFoundError();
    const block = spaceRemovalBlock(spaces, tables, id);
    if (block) throw new SpaceNotRemovableError(block, tables.filter((table) => table.spaceId === id).length);
    await this.deps.tables.saveSpaces(spaces.filter((space) => space.id !== id));
    return this.deps.tables.load();
  }
}
