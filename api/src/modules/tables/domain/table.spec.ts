import { describe, expect, it } from 'vitest';
import { tablesConfiguration } from '../../../../test/support/in-memory-tables.js';
import { disableBlock, normalizeTableDraft, removalBlock, tableDraftIssues, tableIdFor, type TableDraft } from './table.js';

const config = tablesConfiguration();

const draft = (overrides: Partial<TableDraft> = {}): TableDraft => ({
  label: 'Mesa 13',
  spaceId: 'salon',
  capacity: 4,
  description: '',
  enabled: true,
  ...overrides,
});

describe('table rules', () => {
  it('accepts a valid draft', () => {
    expect(tableDraftIssues(draft(), config, null)).toEqual([]);
  });

  it('requires a unique label of up to 30 characters, ignoring case, spaces and accents', () => {
    expect(tableDraftIssues(draft({ label: ' ' }), config, null)).toEqual([{ path: 'label', code: 'required' }]);
    expect(tableDraftIssues(draft({ label: 'x'.repeat(31) }), config, null)).toEqual([{ path: 'label', code: 'too_long' }]);
    expect(tableDraftIssues(draft({ label: ' mesa  01 ' }), config, null)).toEqual([{ path: 'label', code: 'duplicate' }]);
    expect(tableDraftIssues(draft({ label: 'Mesa 01' }), config, 'tbl_01')).toEqual([]);
  });

  it('requires an existing space, an integer capacity from 1 to 20 and a short description', () => {
    expect(tableDraftIssues(draft({ spaceId: 'barra' }), config, null)).toEqual([{ path: 'spaceId', code: 'unknown_space' }]);
    for (const capacity of [0, 21, 2.5, Number.NaN]) {
      expect(tableDraftIssues(draft({ capacity }), config, null)).toEqual([{ path: 'capacity', code: 'out_of_range' }]);
    }
    expect(tableDraftIssues(draft({ capacity: 1 }), config, null)).toEqual([]);
    expect(tableDraftIssues(draft({ capacity: 20 }), config, null)).toEqual([]);
    expect(tableDraftIssues(draft({ description: 'x'.repeat(61) }), config, null)).toEqual([
      { path: 'description', code: 'too_long' },
    ]);
  });

  it('trims the text fields', () => {
    expect(normalizeTableDraft(draft({ label: ' Mesa 13 ', description: ' Ventana ' }))).toMatchObject({
      label: 'Mesa 13',
      description: 'Ventana',
    });
  });

  it('derives the internal id from the number', () => {
    expect(tableIdFor(7)).toBe('tbl_07');
    expect(tableIdFor(123)).toBe('tbl_123');
  });

  it('blocks disabling only while a session is open', () => {
    expect(disableBlock({ openSession: true, hadSession: true })).toBe('table_has_open_session');
    expect(disableBlock({ openSession: false, hadSession: true })).toBeNull();
  });

  it('deletes only a table that never had a session', () => {
    expect(removalBlock({ openSession: true, hadSession: true })).toBe('table_has_open_session');
    expect(removalBlock({ openSession: false, hadSession: true })).toBe('table_has_history');
    expect(removalBlock({ openSession: false, hadSession: false })).toBeNull();
  });
});
