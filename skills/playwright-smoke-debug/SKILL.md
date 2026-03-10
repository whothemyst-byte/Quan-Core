---
name: playwright-smoke-debug
description: Fast browser smoke testing and UI-flow debugging workflow for coding tasks in web apps, especially Next.js applications. Use when validating route navigation, auth redirects, form flows, dashboard interactions, or when creating or debugging Playwright tests for regressions and flaky UI behavior.
---

# Playwright Smoke Debug

Start from the smallest user-visible path that can fail.

1. Enumerate the routes that matter.
2. Pick one happy path and one guard path.
3. Assert visible outcomes with web-first assertions.

Use the route planner before writing a spec.

- Run `node skills/playwright-smoke-debug/scripts/route-smoke-plan.mjs`
- Use static routes directly.
- Treat dynamic routes as requiring fixture data or a seeded id.

Prefer production-like validation for real regressions.

- In Next.js apps, favor testing against a built app when the bug may depend on build-time or server-rendering behavior.
- Use `baseURL` plus resilient locators such as `getByRole`, `getByLabel`, and `getByTestId`.
- Avoid manual sleeps unless diagnosing timing issues that web-first assertions cannot cover.

Load the reference notes when authoring or debugging tests:

- Read [references/playwright-notes.md](references/playwright-notes.md) for current upstream testing guidance and a compact spec template.

Keep the smoke layer thin.

- One test per critical route is usually enough for first coverage.
- Cover auth redirects, primary dashboard load, and one mutation path before adding deeper cases.
