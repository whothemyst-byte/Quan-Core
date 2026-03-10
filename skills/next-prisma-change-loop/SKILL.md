---
name: next-prisma-change-loop
description: Safe and fast implementation workflow for Next.js App Router projects that also use Prisma. Use when changing pages, layouts, route handlers, middleware or proxy boundaries, auth flows, or Prisma schema and generated client behavior in a Next.js plus Prisma codebase.
---

# Next Prisma Change Loop

Treat each change as one of three lanes: UI, server boundary, or schema.

## UI Lane

Use for `app/**`, `components/**`, `hooks/**`, and `store/**` changes that do not alter the data contract.

- Run `pnpm lint`
- Run `pnpm typecheck`

## Server Boundary Lane

Use for `app/api/**`, `middleware.ts`, auth integration code, environment-sensitive logic, or route-shape changes.

- Run `pnpm lint`
- Run `pnpm typecheck`
- Run `pnpm build`

## Schema Lane

Use for `prisma/schema.prisma` and any code that depends on changed models or enums.

1. Run `node skills/next-prisma-change-loop/scripts/schema-impact.mjs`
2. Run `pnpm prisma:generate`
3. Run `pnpm typecheck`
4. Run `pnpm build`

If a development database is available and the schema changed structurally, create a migration instead of only regenerating the client.

- Development: `pnpm exec prisma migrate dev --name <slug>`
- Deployment path: `pnpm exec prisma migrate deploy`

Use the official notes when deciding what to validate:

- Load [references/official-notes.md](references/official-notes.md) for the current Next.js, Prisma, and Playwright guidance distilled from upstream docs.

Respect the current repo state.

- Keep `prisma-client-js` unless the task explicitly includes a Prisma client migration.
- Note that this repo still uses `middleware.ts`; Next.js 16 documents the `proxy.ts` rename, so only migrate that file when the task justifies it.
