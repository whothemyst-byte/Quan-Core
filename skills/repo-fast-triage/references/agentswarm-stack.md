# AgentSwarm Stack

Use this reference only when the repo is the current `agentswarm` app.

## Stack

- Framework: Next.js 16 App Router with React 19 and TypeScript
- Styling: Tailwind CSS 4
- Data: Prisma with PostgreSQL
- Auth: Supabase SSR middleware
- State and UI: Zustand, Framer Motion, `@xyflow/react`

## Primary Commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Prisma client: `pnpm prisma:generate`

## High-Risk Surfaces

- `app/api/**`: route handlers and external integrations
- `middleware.ts`: auth gate and request boundary
- `prisma/schema.prisma`: data model and generated client contract
- `app/**/page.tsx` and `app/**/layout.tsx`: route shape and rendering behavior
- `.env*`: environment-dependent behavior

## Validation Defaults

- UI-only component changes: `pnpm lint`, `pnpm typecheck`
- Route or API changes: `pnpm lint`, `pnpm typecheck`, `pnpm build`
- Prisma schema changes: `pnpm prisma:generate`, `pnpm typecheck`, `pnpm build`
