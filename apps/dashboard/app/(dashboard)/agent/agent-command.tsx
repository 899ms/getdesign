"use client";

import { getAnalytics } from "@getdesign/analytics";
import Link from "next/link";
import { findCachedSite } from "@/lib/cached-site-url";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";

import { InputBar } from "@/components/agent-elements/input-bar";
import { BrandMark } from "@/components/brand-mark";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type AgentCommandProps = {
  cachedSites?: { slug: string; url: string }[];
  refreshSite?: { slug: string; url: string } | null;
  credentialsReady: boolean;
  user: {
    id: string;
    email?: string;
  };
};

type RunStep =
  | "crawl"
  | "capture"
  | "describe"
  | "extract"
  | "synthesize"
  | "render";

type StepStatus = "pending" | "running" | "ok" | "skipped" | "failed";

type RunState = {
  id: Id<"designRuns">;
  status: "queued" | "running" | "completed" | "failed";
  message?: string;
  steps: Record<RunStep, StepStatus>;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isProbablyUrl(value: string) {
  try {
    const url = new URL(normalizeUrl(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function AgentCommand({ credentialsReady, user, cachedSites = [], refreshSite = null }: AgentCommandProps) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const createRun = useMutation(api.designRuns.create);
  const [input, setInput] = useState(refreshSite?.url ?? "");
  const cached = findCachedSite(input, cachedSites);
  const useCached = cached && cached.slug !== refreshSite?.slug;
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-xl flex-col justify-center px-4 py-8">
      <div className="mb-8 flex justify-center">
        <BrandMark size={34} />
      </div>

      {useCached ? (
        <p className="mb-3 text-center text-xs text-muted-foreground">A cached design is ready. Opening it uses no provider credits.</p>
      ) : !credentialsReady ? (
        <p className="mb-3 text-center text-xs text-muted-foreground"><Link href="/account#provider-keys" className="underline underline-offset-4">Add provider keys</Link> to start a new extraction.</p>
      ) : refreshSite && cached?.slug === refreshSite.slug ? (
        <p className="mb-3 text-center text-xs text-muted-foreground">This starts a fresh extraction using your provider keys. The shared snapshot stays available.</p>
      ) : null}

      <InputBar
        size="lg"
        value={input}
        onChange={setInput}
        sendLabel={useCached ? "Open cached site" : "Start extraction"}
        className="px-0 pb-0"
        status={isPending || isRunning ? "submitted" : "ready"}
        disabled={!isAuthenticated || isRunning}
        submitDisabled={!credentialsReady && !useCached}
        placeholder="Enter a URL..."
        onStop={() => {}}
        onSend={({ content }) => {
          const match = findCachedSite(content, cachedSites);
          if (match && match.slug !== refreshSite?.slug) {
            router.push(`/sites/${match.slug}`);
            return;
          }
          getAnalytics().capture({ event: "cta_clicked", properties: { cta: "dashboard_start" } });
          setError(null);
          setRun(null);
          if (!isProbablyUrl(content)) {
            setError("Enter a public URL.");
            return;
          }

          startTransition(async () => {
            setIsRunning(true);
            try {
              const runId = await createRun({
                url: normalizeUrl(content),
                userId: user.id,
                userEmail: user.email,
              });
              setRun({
                id: runId,
                status: "queued",
                message: "Queued",
                steps: {
                  crawl: "pending",
                  capture: "pending",
                  describe: "pending",
                  extract: "pending",
                  synthesize: "pending",
                  render: "pending",
                },
              });
              router.push(`/runs/${runId}`);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Could not start run.",
              );
            } finally {
              setIsRunning(false);
            }
          });
        }}
      />

      {error ? (
        <p className="mt-2 text-center text-xs text-destructive">{error}</p>
      ) : null}
      {run ? <RunProgress run={run} /> : null}
    </div>
  );
}

function RunProgress({ run }: { run: RunState }) {
  return (
    <div className="mt-5 rounded-lg border bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-xs font-medium">
          {run.message ?? "Running"}
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">{run.status}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Opening the run page...
      </p>
    </div>
  );
}
