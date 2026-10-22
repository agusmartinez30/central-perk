import { describe, expect, it } from "vitest";
import {
  buildMapsUrl,
  buildPhoneUrl,
  buildWhatsAppUrl,
  CAFE_DETAIL,
  CAFE_DETAIL_EMPTY,
  CAFE_DETAIL_LINKS_UNAVAILABLE,
} from "@/mocks/cafe-info";
import { TABLE } from "@/mocks/table";

describe("cafe info", () => {
  it("builds an encoded Google Maps search link", () => {
    expect(buildMapsUrl("Av. Corrientes 1234, CABA")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Av.%20Corrientes%201234%2C%20CABA",
    );
  });

  it("builds WhatsApp and phone links from a formatted number", () => {
    expect(buildWhatsAppUrl("+54 9 3547 55-5124")).toBe("https://wa.me/5493547555124");
    expect(buildPhoneUrl("+54 9 3547 55-5124")).toBe("tel:+5493547555124");
  });

  it("reuses the café name from the table mock in every sample", () => {
    for (const detail of [CAFE_DETAIL, CAFE_DETAIL_LINKS_UNAVAILABLE, CAFE_DETAIL_EMPTY]) {
      expect(detail.name).toBe(TABLE.cafeName);
    }
  });
});
