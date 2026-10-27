import { createHmac, randomBytes } from 'node:crypto';
import type { TotpVerifier } from '../application/ports.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const DIGITS = 6;
/** Steps accepted on each side of the current one, to absorb phone clock drift. */
const DRIFT_STEPS = 1;

export function encodeBase32(bytes: Buffer): string {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i < bits.length; i += 5) output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return output;
}

function decodeBase32(value: string): Buffer {
  let bits = '';
  for (const char of value.toUpperCase().replace(/=+$/, '')) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) throw new Error('Invalid base32 secret');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/** RFC 6238 TOTP (SHA-1, 30 s, 6 digits): what Google Authenticator and similar apps use. */
export class Rfc6238Totp implements TotpVerifier {
  verify(secret: string, code: string, at: Date): number | null {
    if (!new RegExp(`^\\d{${DIGITS}}$`).test(code)) return null;
    const key = decodeBase32(secret);
    const current = Math.floor(at.getTime() / 1000 / STEP_SECONDS);
    for (let step = current - DRIFT_STEPS; step <= current + DRIFT_STEPS; step += 1) {
      if (step >= 0 && hotp(key, step) === code) return step;
    }
    return null;
  }

  /** 160-bit secret, the size RFC 4226 recommends. */
  generateSecret(): string {
    return encodeBase32(randomBytes(20));
  }
}
