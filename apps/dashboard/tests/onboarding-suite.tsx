// Run through onboarding.test.ts. Bun's module mocks are process-wide.
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";

import { getFunctionName } from "convex/server";
import { hasRequiredRunCredentials } from "../lib/credential-readiness";
import { listCachedSites } from "../lib/cached-sites";
import type { ProviderKeyMeta } from "../app/(dashboard)/account/provider-keys-card";

type RecentRunFixture = {
  _id: string;
  domain: string;
  status: "queued" | "running" | "completed" | "failed";
};

let auth: { user: { id: string } | null; accessToken?: string };
let storedKeys: ProviderKeyMeta[] = [];
let recentRuns: RecentRunFixture[] = [];
let convexAuthenticated = true;
const query = mock(async (reference: unknown, args: Record<string, unknown> = {}) => {
  const name = getFunctionName(reference as Parameters<typeof getFunctionName>[0]);
  if (name === "userCredentials:listForUser") return storedKeys;
  if (name === "cachedSites:list") return listCachedSites();
  if (name === "designRuns:listRecent") return recentRuns.slice(0, Number(args.limit ?? 3));
  throw new Error(`Unexpected query ${name}`);
});
const getConvexClient = mock(() => ({ query }));

mock.module("@workos-inc/authkit-nextjs", () => ({
  withAuth: async () => auth,
}));
mock.module("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  useRouter: () => ({ refresh() {}, push() {} }),
}));
mock.module("@/lib/convex-server", () => ({ getConvexClient }));
mock.module("../lib/convex-server", () => ({ getConvexClient }));
mock.module("convex/react", () => ({
  useMutation: () => mock(),
  useConvexAuth: () => ({ isAuthenticated: convexAuthenticated, isLoading: !convexAuthenticated }),
}));

const { ExtractionOnboarding } =
  await import("../components/extraction-onboarding");
const { ExtractionGuide } =
  await import("../components/extraction-guide");
const { ProviderKeysCard } =
  await import("../app/(dashboard)/account/provider-keys-card");
const { AgentCommand } = await import("../app/(dashboard)/agent/agent-command");
const { default: AgentPage } = await import("../app/(dashboard)/agent/page");
const { ExportActions } =
  await import("../app/(dashboard)/runs/[slug]/export-actions");

const key = (provider: ProviderKeyMeta["provider"]): ProviderKeyMeta => ({
  provider,
  keySuffix: "demo",
  updatedAt: 1,
});

beforeEach(() => {
  auth = { user: { id: "fixture-user" }, accessToken: "fixture-token" };
  storedKeys = [];
  recentRuns = [];
  convexAuthenticated = true;
  getConvexClient.mockClear();
  query.mockClear();
});

describe("extraction onboarding", () => {
  test("Agent waits for Convex authentication even when provider keys are saved", () => {
    convexAuthenticated = false;
    const html = renderToStaticMarkup(
      <AgentCommand credentialsReady user={{ id: "fixture-user" }} />,
    );
    expect(html).toMatch(/<textarea[^>]*disabled/);
  });
  for (const providers of [
    [],
    ["daytona"],
    ["openai"],
    ["daytona", "openai"],
  ] as ProviderKeyMeta["provider"][][]) {
    test(`server readiness and Account guidance with ${providers.join(" + ") || "no keys"}`, async () => {
      storedKeys = providers.map(key);
      const ready = hasRequiredRunCredentials(storedKeys);
      const html = renderToStaticMarkup(await ExtractionOnboarding());
      expect(getConvexClient).toHaveBeenCalledWith("fixture-token");
      expect(query).toHaveBeenCalledWith(expect.anything(), {});
      expect(html.includes('href="/agent"')).toBe(ready);
      expect(html.includes("Extract a design system")).toBe(ready);
      expect(html.includes('href="/account#provider-keys"')).toBe(!ready);
      expect(html.includes('href="/sites"')).toBe(!ready);
      expect(html.includes("Open an example")).toBe(!ready);
      expect(html).not.toContain("fixture-token");
      expect(html).not.toContain("demo");

      const account = renderToStaticMarkup(
        <ProviderKeysCard keys={storedKeys} credentialsReady={ready} />,
      );
      expect(account).toContain('id="provider-keys"');
      expect(account).toContain(ready ? "Continue to Agent" : "Back to Agent");
      for (const provider of ["daytona", "openai"] as const) {
        expect(account.includes(`id="${provider}-key"`)).toBe(
          !providers.includes(provider),
        );
      }
      if (providers.length === 1) {
        expect(account).toContain(
          `Save your ${providers[0] === "daytona" ? "OpenAI" : "Daytona"} key above`,
        );
      }
    });
  }

  for (const session of [{ user: null }, { user: { id: "fixture-user" } }]) {
    test(`requires an authenticated user and access token: ${JSON.stringify(session)}`, async () => {
      auth = session;
      await expect(ExtractionOnboarding()).rejects.toThrow("redirect:/sign-in");
      expect(getConvexClient).not.toHaveBeenCalled();
    });
  }

  test("Overview shows onboarding only without completed runs and hides the empty recent-run list", () => {
    const page = readFileSync(
      new URL("../app/(dashboard)/page.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain("{runs.length === 0 ? <ExtractionOnboarding /> : null}");
    expect(page).toContain("<RecentRuns");
    expect(page).toContain('href="/runs"');
    expect(page).toContain("<CachedSites");
    expect(page).not.toContain("EmptyDesignRuns");
    expect(
      renderToStaticMarkup(<ExtractionGuide credentialsReady={false} />),
    ).toContain("Open an example");
    expect(
      renderToStaticMarkup(<ExtractionGuide credentialsReady />),
    ).toContain('href="/agent"');
  });

  test("the Agent allows URL lookup without keys and explains new extraction requirements", () => {
    for (const ready of [false, true]) {
      const html = renderToStaticMarkup(
        <AgentCommand credentialsReady={ready} user={{ id: "fixture-user" }} />,
      );
      expect(html).not.toContain("download design.md");
      expect(html).not.toContain("Set up provider keys");
      expect(/<textarea[^>]*disabled=""/.test(html)).toBe(false);
      expect(html.includes("Add provider keys")).toBe(!ready);
      expect(html).not.toContain("Cached sites are ready to open.");
      expect(html).not.toContain("Examples");
      expect(html).not.toContain("Recent");
      expect(html).toContain('aria-label="Start extraction"');
    }
  });

  test("the Agent shows three cached-site prompt suggestions and only the last three runs", () => {
    const html = renderToStaticMarkup(
      <AgentCommand
        credentialsReady
        user={{ id: "fixture-user" }}
        cachedSites={[
          { slug: "linear", title: "Linear", url: "https://linear.app" },
          { slug: "stripe", title: "Stripe", url: "https://stripe.com" },
          { slug: "vercel", title: "Vercel", url: "https://vercel.com" },
          { slug: "clerk", title: "Clerk", url: "https://clerk.com" },
        ]}
        exampleSuggestions={[
          { slug: "linear", title: "Linear", url: "https://linear.app" },
          { slug: "stripe", title: "Stripe", url: "https://stripe.com" },
          { slug: "vercel", title: "Vercel", url: "https://vercel.com" },
        ]}
        recentRuns={[
          { id: "newest", domain: "newest.example", status: "running" },
          { id: "middle", domain: "middle.example", status: "completed" },
          { id: "oldest", domain: "oldest.example", status: "failed" },
          { id: "hidden", domain: "hidden.example", status: "queued" },
        ]}
      />,
    );
    expect(html).not.toContain("Examples");
    expect(html).not.toContain('href="/sites/linear"');
    expect(html).toContain("Linear");
    expect(html).toContain("Stripe");
    expect(html).toContain("Vercel");
    expect(html).not.toContain("Clerk");
    expect(html).toContain("Recent");
    expect(html).toContain('href="/runs"');
    expect(html).toContain('href="/runs/newest"');
    expect(html).toContain('href="/runs/oldest"');
    expect(html).not.toContain('href="/runs/hidden"');
  });

  test("Agent loads three random cached-site suggestions and only the last three private runs", async () => {
    recentRuns = [
      { _id: "newest", domain: "newest.example", status: "running" },
      { _id: "middle", domain: "middle.example", status: "completed" },
      { _id: "oldest", domain: "oldest.example", status: "failed" },
      { _id: "hidden", domain: "hidden.example", status: "queued" },
    ];
    const html = renderToStaticMarkup(
      await AgentPage({ searchParams: Promise.resolve({}) }),
    );
    expect(getConvexClient).toHaveBeenCalledWith("fixture-token");
    expect(query.mock.calls.map(([reference, args]) => [
      getFunctionName(reference as Parameters<typeof getFunctionName>[0]),
      args,
    ])).toEqual([
      ["userCredentials:listForUser", {}],
      ["cachedSites:list", {}],
      ["designRuns:listRecent", { userId: "fixture-user", limit: 3 }],
    ]);
    expect(html).not.toContain("Examples");
    expect(html).not.toContain('href="/sites/linear"');
    const suggested = listCachedSites().filter(site => html.includes(`>${site.title}</button>`));
    expect(suggested).toHaveLength(3);
    expect(html).toContain("Recent");
    expect(html).toContain('href="/runs"');
    expect(html).toContain('href="/runs/newest"');
    expect(html).toContain("Running");
    expect(html).toContain('href="/runs/oldest"');
    expect(html).not.toContain('href="/runs/hidden"');
    expect(html).not.toContain("hidden.example");
  });

  test("completed runs have a visible, keyboard-accessible design.md download", () => {
    const html = renderToStaticMarkup(
      <ExportActions content="# Fixture" filename="design.md" />,
    );
    expect(html).toContain('aria-label="Download design.md"');
    expect(html).toContain("Download design.md</button>");
    const shell = readFileSync(
      new URL(
        "../app/(dashboard)/runs/[slug]/run-page-shell.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(shell).toContain('filename="design.md"');
    expect(shell).toContain("{exportMarkdown ? (");
  });
});
