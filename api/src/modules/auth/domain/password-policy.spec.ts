import { describe, expect, it } from 'vitest';
import { unmetPasswordRequirements } from './password-policy.js';

describe('unmetPasswordRequirements (mirrors admin 11C rules)', () => {
  it('accepts a long passphrase', () => {
    expect(unmetPasswordRequirements('Mostrador de la noche larga')).toEqual([]);
  });

  it('requires 6 characters', () => {
    expect(unmetPasswordRequirements('luna7')).toEqual(['length']);
    expect(unmetPasswordRequirements('luna73')).toEqual([]);
  });

  it('reports an empty password as failing every rule', () => {
    expect(unmetPasswordRequirements('')).toEqual(['length', 'passphrase']);
  });

  it.each(['123456', 'aaaaaa', 'cafecentral', 'qwerty-del-local', 'turno de noche'])(
    'does not judge how guessable %s is',
    (password) => {
      expect(unmetPasswordRequirements(password)).toEqual([]);
    },
  );
});
