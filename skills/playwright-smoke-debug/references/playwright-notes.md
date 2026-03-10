# Playwright Notes

## Current Guidance

- Use Playwright locators that match how users find elements: role, label, placeholder, text, or test id.
- Use Playwright's auto-waiting and web-first assertions instead of fixed sleeps.
- In Next.js, prefer E2E testing with Playwright for async Server Components and route-level behavior.

Sources:

- https://playwright.dev/docs/locators
- https://playwright.dev/docs/test-assertions
- https://nextjs.org/docs/app/guides/testing/playwright

## Minimal Smoke Spec Shape

```ts
import { expect, test } from "@playwright/test";

test("dashboard route loads", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});
```

## Default First Pass

- Public landing page
- Login page
- One protected route redirect or authenticated dashboard route
- One mutation or submit flow tied to the user change
