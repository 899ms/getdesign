import type { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export const OVERVIEW_RUN_QUERY_LIMIT = 12;
export const OVERVIEW_RUN_DISPLAY_LIMIT = 6;
export const RUNS_PAGE_QUERY_LIMIT = 48;

export type RunStatus = "queued" | "running" | "completed" | "failed";

export type ListedDesignRun = {
  _id: string;
  domain: string;
  status: RunStatus;
  mode?: "visual" | "text_only";
};

export type DesignRunPreview = {
  slug: string;
  domain: string;
  status: RunStatus;
  title: string;
  theme: string;
  accent: string;
  image: string | null;
  textOnly: boolean;
};

export function parseDesignMd(
  content: string,
): Pick<DesignRunPreview, "title" | "theme" | "accent"> {
  const titleMatch = content.match(/^# (.+)/m);
  const title = titleMatch
    ? titleMatch[1].replace(/\s*Design System\s*$/i, "").trim()
    : "Unknown";

  const themeMatch = content.match(/## 1\. Visual Theme & Atmosphere\n\n([^\n]+)/);
  const theme = themeMatch ? themeMatch[1].trim() : "";

  const colorMatches = [...content.matchAll(/`(#[A-Fa-f0-9]{6})(?![A-Fa-f0-9])/g)];
  const colors = [...new Set(colorMatches.map((match) => match[1]))].slice(0, 12);

  const accent =
    colors.find((color) => {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 80;
    }) ??
    colors[0] ??
    "#888888";

  return { title, theme, accent };
}

export function runStatusLabel(status: RunStatus) {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function fallbackPreview(run: ListedDesignRun): DesignRunPreview {
  return {
    slug: String(run._id),
    domain: run.domain,
    status: run.status,
    title: run.domain,
    theme: "",
    accent: "#888888",
    image: null,
    textOnly: run.mode === "text_only",
  };
}

export async function loadRecentRunPreviews(
  convex: ConvexHttpClient,
  userId: string,
  recent: ListedDesignRun[],
  options: { requireDesignFile?: boolean; limit?: number } = {},
): Promise<DesignRunPreview[]> {
  const mapped = await Promise.all(
    recent.map(async (run): Promise<DesignRunPreview | null> => {
      if (run.status !== "completed") {
        return options.requireDesignFile ? null : fallbackPreview(run);
      }

      const artifacts = await convex.query(api.designRunArtifacts.getForRun, {
        runId: run._id as Id<"designRuns">,
        userId,
      });
      if (typeof artifacts.markdown !== "string") {
        return options.requireDesignFile ? null : fallbackPreview(run);
      }

      const tiles =
        run.mode === "text_only"
          ? []
          : await convex.query(api.designRunArtifacts.getTileUrls, {
              runId: run._id as Id<"designRuns">,
              userId,
            });

      return {
        image: tiles[0]?.url ?? null,
        textOnly: run.mode === "text_only",
        slug: String(run._id),
        domain: run.domain,
        status: run.status,
        ...parseDesignMd(artifacts.markdown),
      };
    }),
  );

  return mapped
    .filter((run): run is DesignRunPreview => Boolean(run))
    .slice(0, options.limit);
}
