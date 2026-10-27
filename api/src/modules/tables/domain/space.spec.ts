import { describe, expect, it } from 'vitest';
import { createSpaceId, moveSpace, spaceNameIssues, spaceRemovalBlock, type Space } from './space.js';

const salon: Space = { id: 'salon', name: 'Salón', icon: 'store', tone: 'brand' };
const patio: Space = { id: 'patio', name: 'Patio', icon: 'trees', tone: 'success' };
const spaces: Space[] = [salon, { id: 'terraza', name: 'Terraza', icon: 'sun', tone: 'warning' }, patio];

describe('space rules', () => {
  it('requires a name of up to 24 characters, unique ignoring case, spaces and accents', () => {
    expect(spaceNameIssues('   ', spaces, null)).toEqual([{ path: 'name', code: 'required' }]);
    expect(spaceNameIssues('x'.repeat(25), spaces, null)).toEqual([{ path: 'name', code: 'too_long' }]);
    expect(spaceNameIssues(` ${'x'.repeat(24)} `, spaces, null)).toEqual([]);
    expect(spaceNameIssues('  SALON ', spaces, null)).toEqual([{ path: 'name', code: 'duplicate' }]);
    expect(spaceNameIssues('Barra  alta', spaces, null)).toEqual([]);
  });

  it('lets a space keep its own name when renamed', () => {
    expect(spaceNameIssues('salón', spaces, 'salon')).toEqual([]);
    expect(spaceNameIssues('Terraza', spaces, 'salon')).toEqual([{ path: 'name', code: 'duplicate' }]);
  });

  it('derives a unique slug id', () => {
    expect(createSpaceId('Barra alta', spaces)).toBe('barra-alta');
    expect(createSpaceId('  Salón ', [...spaces, { ...salon, id: 'salon-2', name: 'Otro' }])).toBe('salon-3');
    expect(createSpaceId('¡!', spaces)).toBe('espacio');
  });

  it('moves a space one place up or down, keeping the ends in place', () => {
    expect(moveSpace(spaces, 'terraza', 'up').map((space) => space.id)).toEqual(['terraza', 'salon', 'patio']);
    expect(moveSpace(spaces, 'terraza', 'down').map((space) => space.id)).toEqual(['salon', 'patio', 'terraza']);
    expect(moveSpace(spaces, 'salon', 'up')).toBe(spaces);
    expect(moveSpace(spaces, 'patio', 'down')).toBe(spaces);
  });

  it('only deletes a space without tables that is not the last one', () => {
    const tables = [{ spaceId: 'salon' }];
    expect(spaceRemovalBlock(spaces, tables, 'salon')).toBe('space_has_tables');
    expect(spaceRemovalBlock(spaces, tables, 'patio')).toBeNull();
    expect(spaceRemovalBlock([patio], [], 'patio')).toBe('last_space');
  });
});
