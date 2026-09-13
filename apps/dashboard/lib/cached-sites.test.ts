import { describe, expect, test } from "bun:test";
import { getCachedSite, listCachedSites } from "./cached-sites";
import { findCachedSite } from "./cached-site-url";

describe("Curated cached sites", () => {
  test("ships at least ten distinct completed visual snapshots with downloadable documents", () => {
    const sites = listCachedSites();
    expect(sites.length).toBeGreaterThanOrEqual(10);
    expect(new Set(sites.map(site => site.slug)).size).toBe(sites.length);
    expect(new Set(sites.map(site => site.url)).size).toBe(sites.length);
    for (const site of sites) {
      expect(site).not.toHaveProperty("markdown");
      expect(site.mode).toBe("visual");
      expect(site.tiles).toBeGreaterThan(0);
      expect(Date.parse(site.capturedAt)).toBeLessThanOrEqual(Date.now());
      const cached = getCachedSite(site.slug)!;
      expect(cached.markdown).toContain("Design System");
      expect(cached.markdown).toContain("Color Palette");
      expect(cached.markdown).toContain("Typography");
      expect(cached.markdown.toLowerCase()).not.toContain("text-only mode");
    }
    expect(getCachedSite("../../.env.local")).toBeNull();
    expect(getCachedSite("not-in-the-catalog")).toBeNull();
  });

  test("reuses the exact cached page but preserves query, path and scheme differences", () => {
    const sites = [{ slug: "linear", url: "https://linear.app" }];
    expect(findCachedSite("linear.app", sites)?.slug).toBe("linear");
    expect(findCachedSite(" https://linear.app/#features ", sites)?.slug).toBe("linear");
    for (const url of ["https://linear.app/pricing", "https://linear.app/?locale=fr", "http://linear.app", "https://linear.app.evil.test", "https://linear.app@evil.test", "bad url", ""]) {
      expect(findCachedSite(url, sites)).toBeUndefined();
    }
  });
});
