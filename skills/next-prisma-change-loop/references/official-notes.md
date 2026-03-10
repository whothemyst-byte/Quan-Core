# Official Notes

Use this reference when the repo uses Next.js, Prisma, or Playwright and you need current workflow guidance.

## Next.js

- Next.js 16 removes `next lint`; run ESLint directly or through the repo script instead.
- Next.js documents the `middleware` to `proxy` rename in version 16. Existing `middleware.ts` still needs deliberate migration work rather than casual renaming.
- Next.js recommends E2E coverage for async Server Components because unit testing them is not yet the primary path.

Sources:

- https://nextjs.org/docs/app/api-reference/cli/next#next-lint-options
- https://nextjs.org/docs/app/api-reference/file-conventions/middleware
- https://nextjs.org/docs/app/guides/testing/playwright

## Prisma

- Run `prisma generate` after every schema change so the client matches the schema.
- `prisma migrate deploy` applies migrations in deploy environments but does not generate Prisma Client artifacts.
- Prisma documents that the new `prisma-client` generator requires an explicit output path, and Prisma ORM 7 will require that output path.

Sources:

- https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client
- https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate

## Playwright

- Prefer user-facing, web-first assertions over manual waits.
- Use resilient locators such as role, label, or test id selectors.

Sources:

- https://playwright.dev/docs/test-assertions
- https://playwright.dev/docs/locators
