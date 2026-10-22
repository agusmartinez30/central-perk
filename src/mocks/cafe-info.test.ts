import { describe, expect, it } from "vitest";
import { buildMapsUrl, CAFE_INFO } from "@/mocks/cafe-info";
import { TABLE } from "@/mocks/table";

describe("cafe info", () => {
  it("builds an encoded Google Maps search link", () => {
    expect(buildMapsUrl("Av. Corrientes 1234, CABA")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Corrientes%201234%2C%20CABA",
    );
  });

  it("reuses the café name from the table mock", () => {
    expect(CAFE_INFO.name).toBe(TABLE.cafeName);
  });
});
