import { describe, expect, mock, test } from "bun:test";

import * as runs from "./designRuns";
import * as artifacts from "./designRunArtifacts";

// Exercise registered handlers directly, with auth and database boundaries mocked.
const operations = [
  ["create", runs.create, { userId: "owner", url: "https://example.com" }],
  ["get", runs.get, { userId: "owner", id: "run" }],
  ["listRecent", runs.listRecent, { userId: "owner" }],
  ["markDeleted", runs.markDeleted, { userId: "owner", id: "run" }],
  ["beginStep", runs.beginStep, { userId: "owner", id: "run", step: "crawl", message: "Reading" }],
  ["finishStep", runs.finishStep, { userId: "owner", id: "run", step: "crawl", status: "ok", message: "Read" }],
  ["failStep", runs.failStep, { userId: "owner", id: "run", step: "crawl", message: "Failed" }],
  ["getForRun", artifacts.getForRun, { userId: "owner", runId: "run" }],
  ["getTileUrls", artifacts.getTileUrls, { userId: "owner", runId: "run" }],
  ["generateUploadUrl", artifacts.generateUploadUrl, { userId: "owner", runId: "run" }],
  ["upsertValue", artifacts.upsertValue, { userId: "owner", runId: "run", kind: "markdown", text: "private" }],
] as const;

function context(subject: string | null) {
  const row = { _id: "run", userId: "owner", status: "queued", steps: {}, traceEvents: [] };
  const rows = {
    withIndex: () => rows,
    order: () => rows,
    take: async () => [row],
    collect: async () => [],
    unique: async () => null,
  };
  return {
    auth: { getUserIdentity: async () => subject ? { subject } : null },
    db: {
      get: mock(async () => row),
      query: mock(() => rows),
      insert: mock(async () => "new-run"),
      patch: mock(async () => {}),
    },
    storage: { generateUploadUrl: mock(async () => "https://upload.example") },
  };
}

function invoke(operation: unknown, ctx: unknown, args: unknown) {
  return (operation as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })._handler(ctx, args);
}

describe("run and artifact ownership", () => {
  for (const [name, operation, args] of operations) {
    for (const subject of [null, "attacker"]) {
      test(`${name} rejects ${subject ?? "anonymous"} supplying the owner's ID before accessing data`, async () => {
        const ctx = context(subject);
        await expect(invoke(operation, ctx, args)).rejects.toThrow();
        for (const call of Object.values(ctx.db)) expect(call).not.toHaveBeenCalled();
        expect(ctx.storage.generateUploadUrl).not.toHaveBeenCalled();
      });
    }
    test(`${name} permits the authenticated owner`, async () => {
      await invoke(operation, context("owner"), args);
    });
  }

  test("a signed-in user cannot read another user's run using their own ID", async () => {
    expect(await invoke(runs.get, context("attacker"), { id: "run", userId: "attacker" })).toBeNull();
    await expect(invoke(artifacts.getForRun, context("attacker"), { runId: "run", userId: "attacker" })).rejects.toThrow("Run not found");
  });

  test("step claims are atomic so two tabs cannot start the same paid step", async () => {
    const ctx = context("owner");
    const row = await ctx.db.get();
    ctx.db.patch.mockImplementation(async (_id?: unknown, patch?: unknown) => {
      Object.assign(row, patch);
    });
    const args = { id: "run", userId: "owner", step: "capture", message: "Capturing" };
    expect(await invoke(runs.beginStep, ctx, args)).toBe(true);
    expect(await invoke(runs.beginStep, ctx, args)).toBe(false);
    expect(ctx.db.patch).toHaveBeenCalledTimes(1);
  });
});
