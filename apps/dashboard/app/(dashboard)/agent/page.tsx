import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { api } from "@convex/_generated/api";
import { hasCachedSiteImages } from "@convex/lib/cachedSiteSchema";
import { hasRequiredRunCredentials } from "@/lib/credential-readiness";
import { getConvexClient } from "@/lib/convex-server";

import { loadCachedSites, pickRandomItems } from "@/lib/cached-sites";

import { AgentCommand } from "./agent-command";

const RECENT_RUN_LIMIT = 3;

export default async function AgentPage({ searchParams }: {
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { accessToken, user } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  const convex = getConvexClient(accessToken);
  const [keys, cachedSites, recent, { refresh }] = await Promise.all([
    convex.query(api.userCredentials.listForUser, {}),
    loadCachedSites(accessToken),
    convex.query(api.designRuns.listRecent, {
      userId: user.id,
      limit: RECENT_RUN_LIMIT,
    }),
    searchParams,
  ]);
  const refreshSite = cachedSites.find(site => site.slug === refresh) ?? null;
  const catalog = cachedSites.filter(hasCachedSiteImages).map(({ slug, title, url }) => ({
    slug,
    title,
    url,
  }));

  return (
    <AgentCommand
      key={refreshSite?.slug ?? "agent"}
      cachedSites={catalog}
      exampleSuggestions={pickRandomItems(catalog, 3)}
      recentRuns={recent.slice(0, RECENT_RUN_LIMIT).map((run) => ({
        id: String(run._id),
        domain: run.domain,
        status: run.status,
      }))}
      refreshSite={refreshSite ? { slug: refreshSite.slug, url: refreshSite.url } : null}
      credentialsReady={hasRequiredRunCredentials(keys)}
      user={{ id: user.id, email: user.email ?? undefined }}
    />
  );
}
