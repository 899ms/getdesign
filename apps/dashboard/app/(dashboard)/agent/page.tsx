import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

import { api } from "@convex/_generated/api";
import { hasRequiredRunCredentials } from "@/lib/credential-readiness";
import { getConvexClient } from "@/lib/convex-server";

import { loadCachedSites } from "@/lib/cached-sites";

import { AgentCommand } from "./agent-command";

export default async function AgentPage({ searchParams }: {
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { accessToken, user } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  const keys = await getConvexClient(accessToken).query(
    api.userCredentials.listForUser,
    {},
  );
  const credentialsReady = hasRequiredRunCredentials(keys);
  const { refresh } = await searchParams;
  const cachedSites = await loadCachedSites(accessToken);
  const refreshSite = cachedSites.find(site => site.slug === refresh) ?? null;

  return (
    <AgentCommand
      key={refreshSite?.slug ?? "agent"}
      cachedSites={cachedSites.map(({ slug, url }) => ({ slug, url }))}
      refreshSite={refreshSite ? { slug: refreshSite.slug, url: refreshSite.url } : null}
      credentialsReady={credentialsReady}
      user={{ id: user.id, email: user.email ?? undefined }}
    />
  );
}
