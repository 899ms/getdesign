import { expect, test } from "bun:test";
import { artifactSiteName, runPageTitle } from "./design-run-preview";

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
