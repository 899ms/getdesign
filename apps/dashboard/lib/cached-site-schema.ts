import { z } from "zod";

export const cachedSiteSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  url: z.url().refine(value => new URL(value).protocol === "https:"),
  capturedAt: z.iso.datetime(),
  summary: z.string().min(1),
  colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(1).max(8),
  markdown: z.string().min(1000),
  mode: z.literal("visual"),
  tiles: z.number().int().positive(),
});
export type CachedSite = z.infer<typeof cachedSiteSchema>;
export type CachedSiteSummary = Omit<CachedSite, "markdown">;
