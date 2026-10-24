import { describe, expect, it } from "vitest";
import { QR_TOKEN_LENGTH, createQrToken, createUniqueQrToken, sequenceRandom } from "./qr-token";

describe("createQrToken", () => {
  it("builds a 10-character alphanumeric token from the injected random source", () => {
    const token = createQrToken(sequenceRandom([0, 0.5, 0.99]));
    expect(token).toHaveLength(QR_TOKEN_LENGTH);
    expect(token).toMatch(/^[A-Za-z0-9]{10}$/);
    expect(createQrToken(sequenceRandom([0, 0.5, 0.99]))).toBe(token);
  });

  it("uses the platform's secure random source by default", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => createQrToken()));
    expect(tokens.size).toBe(20);
  });
});

describe("createUniqueQrToken", () => {
  it("never returns a token already in use", () => {
    const taken = createQrToken(sequenceRandom([0]));
    const token = createUniqueQrToken([taken], sequenceRandom([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5]));
    expect(token).not.toBe(taken);
    expect(token).toHaveLength(QR_TOKEN_LENGTH);
  });
});
