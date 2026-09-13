import { docsUrl } from "@getdesign/content";

const SURFACES = [
  {
    title: "API",
    href: docsUrl("/surfaces/api"),
    description: "HTTP endpoint at api.getdesign.app",
  },
  {
    title: "CLI",
    href: docsUrl("/surfaces/cli"),
    description: "bunx @getdesign/cli",
  },
  {
    title: "SDK",
    href: docsUrl("/surfaces/sdk"),
    description: "@getdesign/sdk",
  },
  {
    title: "Skills",
    href: docsUrl("/surfaces/skill"),
    description: "Cursor, Claude Code, and Codex",
  },
] as const;

export function DeveloperSurfaces() {
  return (
    <section
      aria-labelledby="developer-surfaces-heading"
      className="rounded-xl border bg-card p-4"
    >
      <h2 id="developer-surfaces-heading" className="text-sm font-medium">
        API, CLI, SDK, and Skills
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        There is no getdesign API key. Dashboard runs use the keys above. Other
        surfaces take Daytona and OpenAI keys in the request or environment.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {SURFACES.map((surface) => (
          <li key={surface.href}>
            <a
              href={surface.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <p className="text-sm font-medium text-foreground">
                {surface.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {surface.description}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
