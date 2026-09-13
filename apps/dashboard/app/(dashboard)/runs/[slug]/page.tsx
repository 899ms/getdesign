import { notFound, redirect } from "next/navigation"
import { withAuth } from "@workos-inc/authkit-nextjs"
import { DesignDocument } from "@/components/design-document"
import { getConvexClient } from "@/lib/convex-server"
import { toRunState } from "@/lib/runs-store"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { RunPageShell } from "./run-page-shell"

export default async function RunPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { user, accessToken } = await withAuth()

  if (!user) {
    redirect("/sign-in")
  }

  const convex = getConvexClient(accessToken)
  const run = await convex.query(api.designRuns.get, {
    id: slug as Id<"designRuns">,
    userId: user.id,
  })

  if (!run) notFound()

  const runState = toRunState(run)
  const artifacts = await convex.query(api.designRunArtifacts.getForRun, {
    runId: slug as Id<"designRuns">,
    userId: user.id,
  })
  const tiles = await convex.query(api.designRunArtifacts.getTileUrls, {
    runId: slug as Id<"designRuns">,
    userId: user.id,
  })

  const content =
    runState.status === "completed" && typeof artifacts.markdown === "string"
      ? artifacts.markdown
      : null

  const markdownContent = content ? (
    <DesignDocument content={content} />
  ) : null

  return (
    <RunPageShell
      key={slug}
      runId={slug}
      userId={user.id}
      initialTiles={tiles}
      totalExpected={runState.tiles}
      exportMarkdown={content}
      markdownContent={markdownContent}
      runState={markdownContent ? null : runState}
    />
  )
}
