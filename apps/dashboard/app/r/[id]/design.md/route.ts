import { loadPublicRun, PUBLIC_RUN_HEADERS } from "@/lib/public-runs";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await loadPublicRun(id, new URL(request.url).origin);
  if (!run) return new Response("Run not found.", { status: 404, headers: PUBLIC_RUN_HEADERS });
  return new Response(run.markdown, {
    headers: { ...PUBLIC_RUN_HEADERS, "Content-Type": "text/markdown; charset=utf-8" },
  });
}
