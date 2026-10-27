import { describe, expect, it } from 'vitest';
import { encodeBase32, Rfc6238Totp } from './rfc6238-totp.js';

// RFC 6238 appendix B uses the ASCII secret "12345678901234567890" (SHA-1). Codes are the
// last 6 digits of the published 8-digit values.
const SECRET = encodeBase32(Buffer.from('12345678901234567890'));

describe('Rfc6238Totp', () => {
  const totp = new Rfc6238Totp();

  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [2000000000, '279037'],
  ])('matches the RFC vector at T=%i', (seconds, code) => {
    expect(totp.verify(SECRET, code, new Date(seconds * 1000))).toBe(Math.floor(seconds / 30));
  });

  it('accepts the previous step to absorb clock drift', () => {
    expect(totp.verify(SECRET, '287082', new Date(89 * 1000))).toBe(1);
  });

  it('rejects wrong and malformed codes', () => {
    expect(totp.verify(SECRET, '000000', new Date(59 * 1000))).toBeNull();
    expect(totp.verify(SECRET, '28708', new Date(59 * 1000))).toBeNull();
  });

  it('generates base32 secrets', () => {
    expect(totp.generateSecret()).toMatch(/^[A-Z2-7]{32}$/);
  });
});
