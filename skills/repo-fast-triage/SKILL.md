---
name: repo-fast-triage
description: Rapid repository understanding and change-scoped verification for coding tasks in JavaScript or TypeScript projects. Use when starting work in an unfamiliar repo, debugging a feature, planning a refactor, or deciding which checks to run after editing specific files so development stays fast without skipping important validation.
---

# Repo Fast Triage

Start by mapping the repo before editing.

1. Read the package manifest and lockfile to identify the package manager and core scripts.
2. Scan top-level framework files with `rg --files -g package.json -g tsconfig.json -g next.config.* -g vite.config.* -g prisma/schema.prisma`.
3. Read only the touched files and the immediate entrypoints they depend on.

Keep the verification loop proportional to the change.

- Use `node skills/repo-fast-triage/scripts/select-checks.mjs <file>...` to get a minimal command list from changed paths.
- Run `pnpm lint` and `pnpm typecheck` for most code edits.
- Add `pnpm build` when touching routing, server code, middleware, config, or environment-sensitive paths.
- Add `pnpm prisma:generate` when touching `prisma/schema.prisma`.

Use the current repo notes when the project matches this workspace:

- Load [references/agentswarm-stack.md](references/agentswarm-stack.md) for the local stack, route layout, and validation defaults.

Prefer a narrow read path.

- Read manifests first.
- Read one layer up and one layer down from the touched file.
- Avoid bulk-loading unrelated files.

Treat verification as part of implementation.

- Re-run the smallest relevant command immediately after edits.
- Escalate to `pnpm build` before closing work on server, auth, config, or route-shape changes.
