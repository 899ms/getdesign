import Link from "next/link";
import {
  OVERVIEW_RUN_QUERY_LIMIT,
  runStatusLabel,
  type DesignRunPreview,
} from "@/lib/design-run-preview";

export function RecentRuns({
  runs,
  preview,
}: {
  runs: DesignRunPreview[];
  preview?: boolean;
}) {
  if (runs.length === 0) return null;

  return (
    <section aria-labelledby="recent-runs-title" className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id="recent-runs-title" className="text-sm font-medium">
            Recent runs
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {preview
              ? `Completed runs with design files from your latest ${OVERVIEW_RUN_QUERY_LIMIT} runs.`
              : "Private extractions from your account."}
          </p>
        </div>
        {preview ? (
          <Link
            href="/runs"
            className="shrink-0 text-xs font-medium text-foreground underline-offset-4 hover:underline"
          >
            Browse all runs
          </Link>
        ) : (
          <p className="shrink-0 text-xs text-muted-foreground">
            {runs.length} available
          </p>
        )}
      </div>
      <div className="divide-y">
        {runs.map((run) => (
          <Link
            key={run.slug}
            href={`/runs/${run.slug}`}
            className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/30"
          >
            {run.image ? (
              <img
                src={run.image}
                alt={`${run.title} website screenshot`}
                loading="lazy"
                className="h-10 w-16 shrink-0 rounded-md border object-cover object-top sm:w-20"
              />
            ) : (
              <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md border text-center text-[10px] leading-tight text-muted-foreground sm:w-20">
                {run.textOnly
                  ? "Text-only"
                  : run.status === "completed"
                    ? "No capture"
                    : runStatusLabel(run.status)}
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{run.title}</p>
              {run.theme ? (
                <p className="truncate text-xs text-muted-foreground">{run.theme}</p>
              ) : run.title !== run.domain ? (
                <p className="truncate text-xs text-muted-foreground">{run.domain}</p>
              ) : null}
            </div>

            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              {run.status === "completed" ? (
                <>
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: run.accent }}
                  />
                  <span className="font-mono text-xs text-muted-foreground">
                    {run.accent}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {runStatusLabel(run.status)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
