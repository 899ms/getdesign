# PR 26 launch review

Reviewed on 2026-09-12, starting from `39302be0ffa99bcc2318312cf4bdf40f94cd062d`.

Implementation commits `3da2c2f` and `0d1380d` were pushed to PR 26.

## Findings and fixes

1. **Run ownership was not authenticated in Convex.** Public run and artifact functions compared records with a caller-supplied user ID. Anonymous callers or a different signed-in user could supply the owner's ID to read runs, obtain artifact URLs, request uploads, and mutate results. All entry points now check the WorkOS token identity before accessing data. A regression suite reproduced 22 unauthorized operations before the fix and rejects all of them afterward. The dashboard now forwards access tokens from its Overview and run server pages and authenticates browser subscriptions and mutations through `ConvexProviderWithAuth`. Client queries wait for authentication.
2. **Concurrent requests could repeat a paid step.** Two tabs could both pass the initial step-status query and start capture or synthesis. `beginStep` now claims the step in a Convex mutation, returning false when it is already running or finished. The losing request returns 409 without marking the active run failed. If a crashed server leaves a claim running, the failure screen offers an explicit “Start new run” action with a provider-usage explanation. This creates a separate owned run linked through `rerunOf`, preserving the original history and preventing its late writes from corrupting the replacement. Navigating to the new run resets the client pipeline state.
3. **Downstream HTTP requests could bypass capture failure.** A direct describe/synthesize/render request did not check its prerequisites. The routes now require successful capture or explicit persisted text-only continuation, plus the relevant completed preceding steps.
4. **Late artifacts could remain invisible.** The dashboard recorded a completed step as fetched before its subscription had returned data. It now derives artifacts from the current query result. Screenshot URLs are matched by filename so a missing URL cannot shift subsequent tiles.
5. **Animated content could prevent readiness indefinitely.** Cursor returned ready content with changing text and geometry signatures. Readiness now requires two consecutive ready observations; a gate button still needs an unchanged signature and safe coordinates before a click. A reappearing loader resets readiness, and the pre-screenshot check still rejects blockers.

The dashboard environment example now lists the required WorkOS, Convex and encryption settings. The onboarding browser fixture explicitly disables analytics configuration instead of referencing an undefined `process` global. Native keyboard checks allow time for the modal focus guards to restore focus.

## Local verification

- Frozen dependency install passed with Bun 1.4.0 and Node 22.22.3. Built workspace declarations before checks.
- Final full suite: 261 passed, zero failures. Its 39 build-dependent SEO cases were run separately with the preview build configuration.
- Marketing and docs preview builds passed. The separate rendered SEO suite passed all 39 cases against those builds.
- The dashboard production build passed using the supplied local configuration.
- All 14 workspace typechecks passed. Dashboard typechecking also passed after the final route and artifact changes.
- Targeted dashboard ESLint and `git diff --check` passed.
- Native Chromium command-menu fixture: 67 checks passed, no skipped keyboard checks. Includes Cmd/Ctrl+K, Tab/Shift+Tab containment, Enter/Space activation, focus restoration and all nine destinations.
- Native Chromium onboarding fixture: key save/removal, Agent readiness, native link/form activation, run navigation and a real `design.md` download to disk passed. Completed-run layouts had no horizontal overflow at 320, 390, 768 and 1280 pixels.
- Live Daytona/Chromium fixtures: ordinary content, a timed loading overlay and an explicit intro gate each produced two capture tiles. The gate was clicked once through Computer Use, and the resulting screenshot shows the underlying page. Sandboxes were deleted afterward.

The browser fixtures use dummy data. They do not establish real credential persistence or authenticated dashboard extraction.

## Launch status

The full 20-brand sweep passed 18 visual extractions and CSS-grounding checks. Cursor initially failed because animated content prevented an identical readiness signature; its separate retry after the fix passed. The combined result is **19 of 20 passed**. OpenAI's homepage returned HTTP 403 during the initial HTML fetch, before capture or model calls. This external failure remains. The initial sweep's median duration was 94.8 seconds, above the aspirational 90-second target.

Results are in `getdesign-runs/brand-smoke/pr26-review/summary-final.json`. The original sweep and Cursor retry are retained separately. `review.html` in the same directory contains the 20 palettes, source links, generated files and a downloadable human-review JSON form. All human ratings remain pending. The 18-of-20 primary-color requirement is a human review gate; CSS grounding alone does not satisfy it.

WorkOS's hosted sign-in page loaded with the supplied configuration. With explicit approval, temporary verified users with random passwords and non-deliverable email addresses were created through WorkOS. Password authentication succeeded, and genuine WorkOS sessions were sealed with the installed AuthKit cookie format for native Chromium. This verifies authenticated dashboard behavior; it does not test the hosted form and OAuth callback end to end. No email authentication or verification flow was invoked.

The real Account page returned 200 with empty provider-key metadata. Both supplied provider keys saved through the UI with HTTP 200, persisted across refresh, and enabled Agent. Credential deletion returned 200; the final account's metadata query confirmed zero remaining keys. The initial account check had no browser errors.

A signed-in `https://example.com` run successfully created a run and completed crawl and CSS extraction. Capture failed with `protected_gate`: the browser reported a login, consent, age, payment or verification gate. The pipeline stopped as intended, without clicking the gate or implicitly selecting text-only mode. A complete authenticated extraction and `design.md` download therefore remain unverified. Test runs were soft-deleted using the existing run deletion mutation; this retains records and any stored artifacts. Temporary WorkOS users were deleted after testing.

Review artifacts are under `getdesign-runs/`, which is ignored by Git. Environment files and provider keys are not included in the change.

The Convex functions and dashboard changes must be deployed together for the ownership and step-claim checks to take effect. A read-only check against the configured deployment queried a random nonexistent user ID without a token and received an empty list instead of an authentication rejection. No existing user's data was requested. This confirms that the deployed run functions still need the ownership fix. No production deployment or merge is part of this verification record.

The browser authentication adapter follows the [Convex AuthKit Next.js template](https://github.com/get-convex/templates/blob/main/template-nextjs-authkit/components/ConvexClientProvider.tsx), checked against the installed WorkOS and Convex types.
