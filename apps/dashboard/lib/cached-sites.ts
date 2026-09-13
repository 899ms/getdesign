import snapshots from "@/data/cached-sites.json";
import { cachedSiteSchema, type CachedSiteSummary } from "./cached-site-schema";

// Curated public-site snapshots only. Never derived from users' private runs.
const sites = snapshots.map(snapshot => cachedSiteSchema.parse(snapshot));

export function listCachedSites(): CachedSiteSummary[] {
  return sites.map(site => ({
    slug: site.slug, title: site.title, url: site.url, capturedAt: site.capturedAt,
    summary: site.summary, colors: site.colors, mode: site.mode, tiles: site.tiles,
  }));
}

export function getCachedSite(slug: string) {
  return sites.find(site => site.slug === slug) ?? null;
}

export function formatCaptureDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(value));
}
