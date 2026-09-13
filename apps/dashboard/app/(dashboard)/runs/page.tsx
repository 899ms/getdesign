import Link from "next/link";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import { RecentRuns } from "@/components/recent-runs";
import { getConvexClient } from "@/lib/convex-server";
import {
  loadRecentRunPreviews,
  RUNS_PAGE_QUERY_LIMIT,
  type ListedDesignRun,
} from "@/lib/design-run-preview";
import { api } from "@convex/_generated/api";

export default async function RunsPage() {
  const { user, accessToken } = await withAuth();

  if (!user || !accessToken) {
    redirect("/sign-in");
  }

  const convex = getConvexClient(accessToken);
  const recent = (await convex.query(api.designRuns.listRecent, {
    userId: user.id,
    limit: RUNS_PAGE_QUERY_LIMIT,
  })) as ListedDesignRun[];
  const runs = await loadRecentRunPreviews(convex, user.id, recent);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Runs</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Link
          href="/agent"
          className={buttonVariants({
            size: "lg",
            className: "ml-auto",
          })}
        >
          Extract
        </Link>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {runs.length === 0 ? (
          <div className="rounded-xl border px-4 py-10 text-center">
            <p className="text-sm font-medium">No runs yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start an extraction from Agent.
            </p>
          </div>
        ) : (
          <RecentRuns runs={runs} />
        )}
      </div>
    </>
  );
}
