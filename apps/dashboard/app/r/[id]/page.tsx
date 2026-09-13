import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignDocument } from "@/components/design-document";
import { loadPublicRun } from "@/lib/public-runs";
import { ExportActions } from "@/app/(dashboard)/runs/[slug]/export-actions";
import { ScreenshotGallery } from "@/app/(dashboard)/runs/[slug]/gallery-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Shared design | getdesign",
  description: "View and download a published design document and its screenshots.",
};

export default async function PublicRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await loadPublicRun(id);
  if (!run) notFound();

  return (
    <main className="flex min-h-svh items-stretch">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <a href="https://getdesign.app" className="text-sm font-semibold">getdesign</a>
          <span className="min-w-0 truncate text-sm text-muted-foreground">{run.domain}</span>
          <ExportActions content={run.markdown} filename="design.md" />
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-6 py-4 text-xs text-muted-foreground">
          <p>Public design · {run.mode === "text_only" ? "Text-only" : "Includes screenshots"}. Viewing and downloading use no provider keys.</p>
          <nav aria-label="Download formats" className="flex gap-4">
            <a className="underline underline-offset-4" href={run.links.markdown}>Raw Markdown</a>
            <a className="underline underline-offset-4" href={run.links.json}>JSON</a>
          </nav>
        </div>
        <DesignDocument content={run.markdown} imagesInGallery={run.images.length > 0} />
      </div>
      {run.images.length > 0 ? <ScreenshotGallery
        runId={`public-${run.id}`}
        tiles={run.images.map(image => ({ ...image, file: image.url }))}
        totalExpected={run.images.length}
      /> : null}
    </main>
  );
}
