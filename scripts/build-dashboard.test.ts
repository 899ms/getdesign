import { describe, expect, test } from "bun:test";
import { buildDashboard, dashboardBuildSteps } from "./build-dashboard";

describe("Dashboard deployment and database seed", () => {
  test("production runs the seed after successful deployment", async () => {
    const commands: string[][] = [];
    await buildDashboard({ VERCEL_ENV: "production", CONVEX_DEPLOY_KEY: "prod:test|fake" }, async args => { commands.push(args); return 0; });
    expect(commands).toEqual([
      ["x", "convex", "deploy", "--cmd", "bun run --cwd apps/dashboard build", "--cmd-url-env-var-name", "NEXT_PUBLIC_CONVEX_URL"],
      ["x", "convex", "run", "cachedSites:seed", "{}"],
    ]);
  });
  test("production refuses missing or non-production keys before any work", async () => {
    for (const key of [undefined, "", "dev:test|fake", "preview:test|fake"]) {
      let calls = 0;
      await expect(buildDashboard({ VERCEL_ENV: "production", CONVEX_DEPLOY_KEY: key }, async () => { calls++; return 0; })).rejects.toThrow("Production requires");
      expect(calls).toBe(0);
    }
  });
  test("failed deployment skips seed and failed seed fails the build", async () => {
    const env = { VERCEL_ENV: "production", CONVEX_DEPLOY_KEY: "prod:test|fake" };
    let calls = 0;
    await expect(buildDashboard(env, async () => { calls++; return 1; })).rejects.toThrow("must not publish");
    expect(calls).toBe(1);
    calls = 0;
    await expect(buildDashboard(env, async () => ++calls === 1 ? 0 : 1)).rejects.toThrow("Seed shared sites in production failed");
    expect(calls).toBe(2);
  });
  test("preview seeds only its isolated deployment and cannot use a production key", () => {
    const steps = dashboardBuildSteps({ VERCEL_ENV: "preview", CONVEX_DEPLOY_KEY: "preview:team:project|fake" });
    expect(steps).toHaveLength(1);
    expect(steps[0]!.args.slice(-2)).toEqual(["--preview-run", "cachedSites:seed"]);
    for (const key of ["prod:test|fake", "dev:test|fake", "preview:shared-backend|fake"]) {
      expect(() => dashboardBuildSteps({ VERCEL_ENV: "preview", CONVEX_DEPLOY_KEY: key })).toThrow("refusing to deploy");
    }
    expect(dashboardBuildSteps({ VERCEL_ENV: "preview" })[0]!.args).toEqual(["run", "--cwd", "apps/dashboard", "build"]);
  });
});
