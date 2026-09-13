import { withDesignImages } from "@getdesign/tools/render";
import { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { getConvexClient } from "./convex-server";

export const PUBLIC_RUN_HEADERS = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
};

type PublishedRun = NonNullable<FunctionReturnType<typeof api.publicRuns.get>>;

export function formatPublicRun(run: PublishedRun, origin?: string) {
  const path = `/r/${encodeURIComponent(run.id)}`;
  const link = (suffix: string) => origin ? new URL(`${path}${suffix}`, origin).href : `${path}${suffix}`;
  const images = run.images.map(image => ({
    ...image, url: link(`/images/${image.index}`), alt: `Captured page tile ${image.index + 1}`,
  }));
  return {
    schemaVersion: 1 as const,
    ...run,
    markdown: withDesignImages(run.markdown, images),
    images,
    links: { page: link(""), markdown: link("/design.md"), json: link("/design.json") },
  };
}

export async function loadPublicRun(id: string, origin?: string) {
  const run = await getConvexClient().query(api.publicRuns.get, { id });
  return run ? formatPublicRun(run, origin) : null;
}
