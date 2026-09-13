import type { ComponentProps } from "react";
import { getFunctionName } from "convex/server";
import { ExtractionGuide } from "../../components/extraction-guide";
import { hasRequiredRunCredentials } from "../../lib/credential-readiness";
import { getCachedSite, listCachedSites } from "../../lib/cached-sites";
import { fixture, navigate, refresh } from "./onboarding-state";

export default function Link({
  href,
  children,
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        navigate(href ?? "/");
      }}
    >
      {children}
    </a>
  );
}

export function useRouter() {
  return { refresh, push: navigate };
}
export function redirect(path: string): never {
  throw new Error(`Unexpected fixture redirect: ${path}`);
}
export function notFound(): never {
  throw new Error("notFound");
}
export async function withAuth() {
  return { user: { id: "fixture-user" }, accessToken: "fixture-token" };
}
export function ExtractionOnboarding() {
  return (
    <ExtractionGuide
      credentialsReady={hasRequiredRunCredentials(fixture.keys)}
    />
  );
}
export function useMutation() {
  return async () => "fixture-completed-run";
}
export function useConvexAuth() {
  return { isAuthenticated: true, isLoading: false };
}
export function useQuery() {
  return [];
}
export function useConvex() {
  return { query: async () => null };
}
export function getConvexClient() {
  return {
    async query(
      reference: Parameters<typeof getFunctionName>[0],
      args: Record<string, unknown> = {},
    ) {
      switch (getFunctionName(reference)) {
        case "designRuns:listRecent":
          return fixture.populated
            ? [
                {
                  _id: "fixture-completed-run",
                  domain: "example.test",
                  status: "completed",
                },
                {
                  _id: "fixture-running-run",
                  domain: "linear.app",
                  status: "running",
                },
                {
                  _id: "fixture-failed-run",
                  domain: "stripe.com",
                  status: "failed",
                },
              ]
            : [];
        case "designRuns:summarizeForUser":
          return fixture.populated
            ? { total: 3, completed: 1, failed: 1, active: 1 }
            : { total: 0, completed: 0, failed: 0, active: 0 };
        case "designRunArtifacts:getForRun":
          return { markdown: fixture.markdown };
        case "designRunArtifacts:getTileUrls":
          return [];
        case "userCredentials:listForUser":
          return fixture.keys;
        case "cachedSites:list":
          return listCachedSites();
        case "cachedSites:get":
          return getCachedSite(String(args.slug));
        default:
          throw new Error("Unexpected query in local fixture");
      }
    },
  };
}

