# Cached site library

Overview includes a shared library of public-site design snapshots. Each card links to a saved document, includes its capture date and palette, and offers a `design.md` download. Viewing and downloading use no provider credits and require no saved provider keys. Dashboard sign-in is still required.

Entering an exact cached page URL in Agent opens that snapshot. A fragment or omitted root slash does not change the page; a different path, query string or scheme requires a separate extraction. The **Refresh site** link prefills Agent and explicitly starts a new private run with the user's provider keys when submitted. It does not overwrite the shared snapshot or publish the user's run.

The catalog is versioned in `apps/dashboard/data/cached-sites.json` and bundled with the dashboard. It contains only curated public-site output, never account IDs, private run data or provider credentials. The existing Convex run tables and ownership rules remain responsible for private runs. Shared snapshots are not automatically refreshed or presented as live site data.

## Refresh the library

From the repository root, with the approved local environment file:

```sh
bun --env-file=apps/dashboard/.env.local scripts/cache-sites.ts
```

This runs three visual extractions concurrently across 12 public sites. It uses the configured Daytona and OpenAI keys and incurs provider usage. Only completed visual runs whose palettes are grounded in the crawled CSS enter the catalog. A secret-value check and strict metadata schema run before writing. The script replaces the catalog atomically only after at least ten sites pass; otherwise the previous catalog remains intact. Intermediate snapshots and the batch report stay in the ignored `getdesign-runs/cached-sites/` directory. Sandboxes follow the existing pipeline's cleanup lifecycle.

Review the generated catalog diff, run the dashboard checks, and deploy the dashboard to publish a refreshed library. No Convex schema deployment is needed for this library. The separate PR 26 ownership fix still requires a coordinated Convex deployment before launch.
