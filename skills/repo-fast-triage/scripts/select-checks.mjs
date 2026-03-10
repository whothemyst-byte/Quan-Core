#!/usr/bin/env node

const files = process.argv.slice(2).map((value) => value.replace(/\\/g, "/"));

const checks = new Set();
const notes = new Set();

if (files.length === 0) {
  checks.add("pnpm lint");
  checks.add("pnpm typecheck");
  notes.add("No paths provided. Defaulting to the core code-quality loop.");
}

for (const file of files) {
  if (/^(package\.json|pnpm-lock\.yaml|package-lock\.json|bun\.lockb)$/.test(file)) {
    checks.add("pnpm install");
    checks.add("pnpm lint");
    checks.add("pnpm typecheck");
    checks.add("pnpm build");
    notes.add("Dependency manifest changed. Reinstall and run the full build path.");
    continue;
  }

  if (/^prisma\/schema\.prisma$/.test(file)) {
    checks.add("pnpm prisma:generate");
    checks.add("pnpm typecheck");
    checks.add("pnpm build");
    notes.add("Prisma schema changed. Regenerate the client before validation.");
    continue;
  }

  if (/^(app\/api\/|middleware\.ts$|next\.config\.(js|mjs|ts)|postcss\.config\.(js|mjs|ts)|eslint\.config\.(js|mjs|ts)|\.env(\..+)?$)/.test(file)) {
    checks.add("pnpm lint");
    checks.add("pnpm typecheck");
    checks.add("pnpm build");
    notes.add("Server, routing, or config surface changed. Include a production build.");
    continue;
  }

  if (/^(app\/|components\/|hooks\/|lib\/|store\/|types\/)/.test(file)) {
    checks.add("pnpm lint");
    checks.add("pnpm typecheck");
    continue;
  }

  if (/^(public\/|README\.md$)/.test(file)) {
    notes.add("Static or documentation files changed. Runtime checks may be unnecessary.");
  }
}

if (checks.size === 0) {
  checks.add("pnpm lint");
  checks.add("pnpm typecheck");
  notes.add("No matching rule hit. Falling back to the core validation loop.");
}

console.log("Recommended commands:");
for (const check of checks) {
  console.log(`- ${check}`);
}

if (notes.size > 0) {
  console.log("\nNotes:");
  for (const note of notes) {
    console.log(`- ${note}`);
  }
}
