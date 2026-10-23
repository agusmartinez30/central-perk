import { describe, expect, it } from "vitest";
import { formatPrice } from "@/shared/lib/format-price";

describe("formatPrice", () => {
  it("formats ARS amounts with a dot thousands separator and no space", () => {
    expect(formatPrice(19900)).toBe("$19.900");
  });

  it("formats amounts below one thousand without a separator", () => {
    expect(formatPrice(900)).toBe("$900");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0");
  });

  it("formats millions with two separators", () => {
    expect(formatPrice(1234567)).toBe("$1.234.567");
  });

  it("rounds to whole pesos", () => {
    expect(formatPrice(4499.6)).toBe("$4.500");
  });

  it("prefixes negative amounts with a minus sign", () => {
    expect(formatPrice(-1200)).toBe("-$1.200");
  });
});
