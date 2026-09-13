import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function ExtractionGuide({
  credentialsReady,
}: {
  credentialsReady: boolean;
}) {
  if (credentialsReady) {
    return (
      <section
        aria-labelledby="extraction-heading"
        className="rounded-xl border bg-card p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 id="extraction-heading" className="text-base font-medium">
              Extract a design system
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a public URL in Agent.
            </p>
          </div>
          <Link
            href="/agent"
            className={buttonVariants({
              size: "lg",
              className: "self-start sm:self-auto",
            })}
          >
            Extract a design system
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="extraction-heading"
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 id="extraction-heading" className="text-base font-medium">
            Turn a website into a design system
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save your Daytona and OpenAI keys to start an extraction, or open an
            example first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            href="/account#provider-keys"
            className={buttonVariants({
              size: "lg",
            })}
          >
            Add provider keys
          </Link>
          <Link
            href="/sites"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
            })}
          >
            Open an example
          </Link>
        </div>
      </div>
    </section>
  );
}
