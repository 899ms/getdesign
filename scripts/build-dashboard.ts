/** Vercel build entry point. A production frontend is published only after the
 * corresponding Convex deployment and its shared-site seed both succeed. */
import { resolve } from "node:path";

type Environment = Record<string, string | undefined>;
type BuildStep = { label: string; args: string[] };
const buildCommand = "bun run --cwd apps/dashboard build";

export function dashboardBuildSteps(env: Environment): BuildStep[] {
  const key = env.CONVEX_DEPLOY_KEY?.trim();
  if (env.VERCEL_ENV === "production") {
    if (!key || !/^prod:[^:|]+\|.+$/.test(key)) {
      throw new Error("Production requires a production CONVEX_DEPLOY_KEY in Vercel's Production environment; no deployment or build was started.");
    }
    return [
      { label: "Build dashboard and deploy production Convex", args: ["x", "convex", "deploy", "--cmd", buildCommand, "--cmd-url-env-var-name", "NEXT_PUBLIC_CONVEX_URL"] },
      // The same production deploy key selects the same backend for both calls.
      { label: "Seed shared sites in production", args: ["x", "convex", "run", "cachedSites:seed", "{}"] },
    ];
  }
  if (env.VERCEL_ENV === "preview" && key) {
    if (!/^preview:[^:|]+:[^:|]+\|.+$/.test(key)) throw new Error("Preview builds require a Preview Deploy Key; refusing to deploy to a shared or production backend.");
    return [{ label: "Build dashboard, deploy preview Convex and seed shared sites", args: ["x", "convex", "deploy", "--cmd", buildCommand, "--cmd-url-env-var-name", "NEXT_PUBLIC_CONVEX_URL", "--preview-run", "cachedSites:seed"] }];
  }
  return [{ label: "Build dashboard", args: ["run", "--cwd", "apps/dashboard", "build"] }];
}

export async function buildDashboard(
  env: Environment,
  run: (args: string[]) => Promise<number>,
) {
  for (const step of dashboardBuildSteps(env)) {
    console.log(step.label);
    const code = await run(step.args);
    if (code !== 0) throw new Error(`${step.label} failed (exit ${code}); dashboard deployment must not publish.`);
  }
}

if (import.meta.main) {
  await buildDashboard(process.env, async args => {
    const child = Bun.spawn([process.execPath, ...args], {
      cwd: resolve(import.meta.dir, ".."), stdin: "inherit", stdout: "inherit", stderr: "inherit",
    });
    return await child.exited;
  });
}
