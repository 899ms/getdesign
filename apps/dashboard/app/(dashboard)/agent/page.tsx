import { Suspense } from "react";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { hasCachedSiteImages } from "@convex/lib/cachedSiteSchema";
import { AgentRecentRunsSkeleton } from "@/components/dashboard-skeletons";
import { listCachedSites, pickRandomItems } from "@/lib/cached-sites";

import { AgentCommand } from "./agent-command";
import { AgentRecentRunsLoader } from "./agent-recent-runs";

export default async function AgentPage({ searchParams }: {
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { accessToken, user } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  const { refresh } = await searchParams;
  const catalog = listCachedSites().filter(hasCachedSiteImages).map(({ slug, title, url }) => ({
    slug,
    title,
    url,
  }));
  const refreshSite = catalog.find((site) => site.slug === refresh) ?? null;

  return (
    <AgentCommand
      key={refreshSite?.slug ?? "agent"}
      cachedSites={catalog}
      exampleSuggestions={pickRandomItems(catalog, 3)}
      refreshSite={refreshSite}
      user={{ id: user.id, email: user.email ?? undefined }}
    >
      <Suspense fallback={<AgentRecentRunsSkeleton />}>
        <AgentRecentRunsLoader userId={user.id} accessToken={accessToken} />
      </Suspense>
    </AgentCommand>
  );
}
