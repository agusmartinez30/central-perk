import { describe, expect, it } from "vitest";
import { CAFE_DETAIL, CAFE_DETAIL_EMPTY, CAFE_DETAIL_LINKS_UNAVAILABLE } from "@/mocks/cafe-info";
import type { CafeDetail } from "@/mocks/types";
import { CAFE_INFO_FORCED_STATES, getCafeDetail, getCafeInfoView } from "./cafe-info-view";

describe("getCafeDetail", () => {
  it("uses the full detail when no state is forced", () => {
    expect(getCafeDetail(null)).toBe(CAFE_DETAIL);
  });

  it("swaps in the sample data of each forced variant", () => {
    expect(getCafeDetail("unavailable")).toBe(CAFE_DETAIL_LINKS_UNAVAILABLE);
    expect(getCafeDetail("empty")).toBe(CAFE_DETAIL_EMPTY);
  });

  it("accepts the forced states of the two degraded designs", () => {
    expect(CAFE_INFO_FORCED_STATES).toEqual(["unavailable", "empty"]);
  });
});

describe("getCafeInfoView", () => {
  it("shows every section with live links on the full detail", () => {
    const view = getCafeInfoView(CAFE_DETAIL);

    expect(view.description).toBe(CAFE_DETAIL.description);
    expect(view.location?.mapsHref).toMatch(/^https:\/\/www\.google\.com\/maps\//);
    expect(view.contact).toEqual({
      showHint: true,
      channels: [
        { kind: "whatsapp", href: "https://wa.me/5493547555124", primary: true },
        { kind: "phone", href: "tel:+5493547555124", primary: false },
      ],
    });
    expect(view.links?.showInactiveHint).toBe(false);
    expect(view.links?.rows.every((row) => row.href !== null)).toBe(true);
    expect(view.hours).toMatchObject({ kind: "week", closesAt: "20:00" });
  });

  it("marks missing links and channels as unavailable", () => {
    const view = getCafeInfoView(CAFE_DETAIL_LINKS_UNAVAILABLE);

    expect(view.location?.mapsHref).toBeNull();
    expect(view.contact?.showHint).toBe(false);
    expect(view.contact?.channels).toEqual([
      { kind: "whatsapp", href: null, primary: false },
      { kind: "phone", href: "tel:+5493547555124", primary: true },
    ]);
    expect(view.links?.showInactiveHint).toBe(true);
    expect(view.links?.rows.map((row) => row.href !== null)).toEqual([false, true, false]);
    expect(view.hours).toEqual({ kind: "closed", reopens: "mañana a las 08:00" });
  });

  it("collapses every section without data into its empty state", () => {
    expect(getCafeInfoView(CAFE_DETAIL_EMPTY)).toEqual({
      description: null,
      location: null,
      contact: null,
      links: null,
      hours: null,
    });
  });

  it("treats blank values as missing", () => {
    const blank: CafeDetail = {
      ...CAFE_DETAIL,
      description: "  ",
      address: { street: " ", city: "Alta Gracia", mapsUrl: "https://maps.example" },
      contact: { whatsapp: "", phone: " " },
      links: [{ network: "website", handle: "cafecentral.demo", url: " " }],
    };
    const view = getCafeInfoView(blank);

    expect(view.description).toBeNull();
    expect(view.location).toBeNull();
    expect(view.contact).toBeNull();
    expect(view.links?.rows).toEqual([{ network: "website", handle: "cafecentral.demo", href: null }]);
  });

  it("keeps closed days in the weekly table", () => {
    const view = getCafeInfoView(CAFE_DETAIL);
    expect(view.hours?.kind === "week" && view.hours.rows.at(-1)).toEqual({ days: "Domingo", hours: null });
  });

  it("drops the hours section when no schedule is published, even if the café is open", () => {
    const view = getCafeInfoView({ ...CAFE_DETAIL, schedule: [] });
    expect(view.hours).toBeNull();
  });
});
