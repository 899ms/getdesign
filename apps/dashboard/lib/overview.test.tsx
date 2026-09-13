import { beforeEach, describe, expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getFunctionName } from "convex/server";
import { listCachedSites } from "./cached-sites";
import { ExtractionGuide } from "../components/extraction-guide";

type RunFixture = {
  _id: string;
  domain: string;
  status: "queued" | "running" | "completed" | "failed";
};

let recent: RunFixture[] = [];
let artifacts: Record<string, { markdown?: string }> = {};

const query = mock(async (_reference: unknown, args: Record<string, unknown>) => {
  if (getFunctionName(_reference as Parameters<typeof getFunctionName>[0]) === "cachedSites:list") return listCachedSites();
  if (getFunctionName(_reference as Parameters<typeof getFunctionName>[0]) === "designRunArtifacts:getTileUrls") return [{ url: "https://example.com/captured.png" }];
  if ("runId" in args) return artifacts[String(args.runId)] ?? {};
  return recent.slice(0, Number(args.limit));
});

// Mock auth/data and the independently tested onboarding server boundary.
// Keep the real onboarding UI in this render to check the combined Overview.
mock.module("@workos-inc/authkit-nextjs", () => ({
  withAuth: async () => ({ user: { id: "overview-test-user" }, accessToken: "overview-token" }),
}));
const getConvexClient = mock(() => ({ query }));
mock.module("./convex-server", () => ({
  getConvexClient,
}));
mock.module("../components/extraction-onboarding", () => ({
  ExtractionOnboarding: () => <ExtractionGuide credentialsReady={false} />,
}));

const { default: Page } = await import("../app/(dashboard)/page");

beforeEach(() => {
  recent = [];
  artifacts = {};
  query.mockClear();
  getConvexClient.mockClear();
});

function completedRun(id: string): RunFixture {
  artifacts[id] = { markdown: `# ${id} Design System\n\nAccent: \`#abcdef\`` };
  return { _id: id, domain: `${id}.example`, status: "completed" };
}

describe("Overview recent-run summary", () => {
  test("keeps the shared catalog off Overview", async () => {
    const html = renderToStaticMarkup(await Page());
    expect(html).not.toContain("Cached sites");
    expect(html).not.toContain('href="/sites/linear"');
    expect(html).not.toContain("Recent runs");
    expect(html).not.toContain("0 shown");
    expect(html).toContain('href="/account#provider-keys"');
    expect(html).toContain('href="/sites"');
  });

  test("authenticates the server's run queries with the WorkOS access token", async () => {
    await Page();
    expect(getConvexClient).toHaveBeenCalledWith("overview-token");
  });
  test("shows setup onboarding when there are no completed runs", async () => {
    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("Turn a website into a design system");
    expect(html).toContain('href="/account#provider-keys"');
    expect(html).toContain('href="/sites"');
    expect(html).not.toContain("Recent runs");
    expect(html).not.toContain("No completed design systems yet");
  });

  test("removes unsupported statistics and the inactive View all control", async () => {
    const html = renderToStaticMarkup(await Page());

    for (const removed of [
      "Your runs",
      "Total runs",
      "3.2M",
      "13k",
      "google.com/s2/favicons",
      "View all",
    ]) {
      expect(html).not.toContain(removed);
    }
    expect(html).not.toContain("Recent runs");
  });

  test("counts only displayed completed runs with design files, scoped to the user", async () => {
    recent = [
      completedRun("visible"),
      { _id: "queued", domain: "queued.example", status: "queued" },
      { _id: "running", domain: "running.example", status: "running" },
      { _id: "failed", domain: "failed.example", status: "failed" },
      { _id: "missing", domain: "missing.example", status: "completed" },
    ];

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("1 shown");
    expect(html).toContain("Completed runs with design files from your latest 24 runs.");
    expect(html).toContain('href="/runs/visible"');
    for (const id of ["queued", "running", "failed", "missing"]) {
      expect(html).not.toContain(`href="/runs/${id}"`);
    }
    expect(html).toContain("Extract");
    expect(html).not.toContain("Turn a website into a design system");
    expect(query.mock.calls.map(([, args]) => args)).toEqual([
      { userId: "overview-test-user", limit: 24 },
      { userId: "overview-test-user", runId: "visible" },
      { userId: "overview-test-user", runId: "missing" },
      { userId: "overview-test-user", runId: "visible" },
    ]);
  });

  test("labels a full query window as shown runs, not a lifetime total", async () => {
    recent = Array.from({ length: 25 }, (_, i) => completedRun(`run-${i}`));

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain("24 shown");
    expect(html).toContain("from your latest 24 runs.");
    expect(html.match(/href="\/runs\//g)).toHaveLength(24);
    expect(html).not.toContain('href="/runs/run-24"');
  });
});


test("Examples lists shared snapshots without mixing them into private run counts", async () => {
  const { default: SitesPage } = await import("../app/(dashboard)/sites/page");
  const html = renderToStaticMarkup(await SitesPage());
  expect(html).toContain("Examples");
  expect(html).toContain('href="/sites/linear"');
  expect(html).toContain("Captured");
  expect((html.match(/href="\/sites\//g) ?? []).length).toBeGreaterThanOrEqual(10);
});

test("a legacy cached row cannot crash the catalog or display an image-free card", async () => {
  const { CachedSites } = await import("../components/cached-sites");
  const site = listCachedSites()[0]!;
  const broken = { ...site, slug: "legacy", images: [] };
  const html = renderToStaticMarkup(<CachedSites sites={[broken, site]} />);
  expect(html).toContain(`href="/sites/${site.slug}"`);
  expect(html).not.toContain('href="/sites/legacy"');
  expect(html).toContain("1 available");
});
