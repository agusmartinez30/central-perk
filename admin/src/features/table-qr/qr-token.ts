/** Random number in [0, 1). Injected so token generation is deterministic in tests. */
export type RandomSource = () => number;

export const QR_TOKEN_LENGTH = 10;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Cryptographically secure source backed by `crypto.getRandomValues`. */
export function secureRandom(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 2 ** 32;
}

/** Cycles through fixed values: a deterministic source for tests and forced screen states. */
export function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

/** Public, non-guessable token such as "4pX9kR2mL7" (10 alphanumeric characters). */
export function createQrToken(random: RandomSource = secureRandom): string {
  let token = "";
  for (let index = 0; index < QR_TOKEN_LENGTH; index += 1) {
    token += ALPHABET[Math.min(ALPHABET.length - 1, Math.floor(random() * ALPHABET.length))];
  }
  return token;
}

/** A token not present in `taken` (active or revoked), so a rotated code never comes back. */
export function createUniqueQrToken(taken: Iterable<string>, random: RandomSource = secureRandom): string {
  const used = new Set(taken);
  let token = createQrToken(random);
  while (used.has(token)) token = createQrToken(random);
  return token;
}
