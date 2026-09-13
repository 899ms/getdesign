import { expect, test } from "bun:test";
import { artifactSiteName, parseDesignMd, runPageTitle } from "./design-run-preview";

test("run page title uses the design heading, then crawl name, then domain", () => {
  expect(
    runPageTitle({
      domain: "example.com",
      markdown: "# Mohtasham's Portfolio Design System\n",
    }),
  ).toBe("Mohtasham's Portfolio");
  expect(
    runPageTitle({
      domain: "example.com",
      crawlSiteName: "Example",
    }),
  ).toBe("Example");
  expect(runPageTitle({ domain: "example.com" })).toBe("example.com");
  expect(artifactSiteName({ siteName: " Linear " })).toBe("Linear");
});

test("parseDesignMd still exports from the dashboard helper", () => {
  expect(
    parseDesignMd("# Linear Design System\n\n## 1. Visual Theme & Atmosphere\n\nClean.\n\n`#3366FF`"),
  ).toEqual({
    title: "Linear",
    theme: "Clean.",
    accent: "#3366FF",
  });
});
