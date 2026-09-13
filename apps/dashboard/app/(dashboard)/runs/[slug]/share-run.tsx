"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export function ShareRun({ runId, isPublic }: { runId: string; isPublic: boolean }) {
  const setVisibility = useMutation(api.publicRuns.setVisibility);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const path = `/r/${encodeURIComponent(runId)}`;

  async function changeVisibility() {
    setBusy(true);
    setError(null);
    try {
      await setVisibility({ id: runId as Id<"designRuns">, visibility: isPublic ? "private" : "public" });
      setCopied(false);
      router.refresh();
    } catch {
      setError("Could not update sharing. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
      setError(null);
      setCopied(true);
    } catch {
      setError("Could not copy the link. Open the public page and copy its address.");
    }
  }

  return (
    <section aria-label="Run sharing" className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
      <div className="text-xs text-muted-foreground">
        <p>{isPublic ? "Public. Anyone with the link can view and download this design and its screenshots." : "Private. Publishing lets anyone view and download this design and its screenshots."}</p>
        {error ? <p role="alert" className="mt-1 text-destructive">{error}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isPublic ? <>
          <a href={path} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-4">Open public page</a>
          <Button variant="outline" size="sm" onClick={() => void copyLink()}>{copied ? "Link copied" : "Copy link"}</Button>
        </> : null}
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void changeVisibility()}>
          {busy ? "Saving…" : isPublic ? "Make private" : "Publish run"}
        </Button>
      </div>
    </section>
  );
}
