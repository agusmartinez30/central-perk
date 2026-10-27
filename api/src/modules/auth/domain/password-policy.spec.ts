import { describe, expect, it } from 'vitest';
import { unmetPasswordRequirements } from './password-policy.js';

describe('unmetPasswordRequirements (mirrors admin 11C rules)', () => {
  it('accepts a long passphrase', () => {
    expect(unmetPasswordRequirements('Mostrador de la noche larga', 'turno@cafecentral.com')).toEqual([]);
  });

  it('requires 12 characters', () => {
    expect(unmetPasswordRequirements('Corta!x9', undefined)).toEqual(['length']);
  });

  it('reports an empty password as failing every rule', () => {
    expect(unmetPasswordRequirements('', undefined)).toEqual(['length', 'passphrase', 'strength']);
  });

  it.each(['aaaaaaaaaaaaaa', 'mi password segura', 'Cafe Central 2026', 'qwerty-del-local', 'mi clave 123456'])(
    'rejects guessable value %s',
    (password) => {
      expect(unmetPasswordRequirements(password, undefined)).toContain('strength');
    },
  );

  it('rejects passwords containing the email name', () => {
    expect(unmetPasswordRequirements('el turno de la noche', 'turno@cafecentral.com')).toEqual(['strength']);
  });
});
