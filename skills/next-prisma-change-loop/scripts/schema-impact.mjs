#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaPath = path.join(root, "prisma", "schema.prisma");

if (!existsSync(schemaPath)) {
  console.error(`Prisma schema not found at ${schemaPath}`);
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");
const provider = schema.match(/generator\s+client\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1] ?? "unknown";
const hasOutput = /generator\s+client\s*\{[\s\S]*?output\s*=/.test(schema);
const datasource = schema.match(/datasource\s+\w+\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1] ?? "unknown";
const modelCount = [...schema.matchAll(/^\s*model\s+\w+/gm)].length;
const enumCount = [...schema.matchAll(/^\s*enum\s+\w+/gm)].length;
const migrationsDir = path.join(root, "prisma", "migrations");
const migrationCount = existsSync(migrationsDir) ? readdirSync(migrationsDir).filter((entry) => !entry.startsWith(".")).length : 0;

console.log("Prisma schema summary:");
console.log(`- client generator: ${provider}`);
console.log(`- datasource: ${datasource}`);
console.log(`- models: ${modelCount}`);
console.log(`- enums: ${enumCount}`);
console.log(`- explicit output path: ${hasOutput ? "yes" : "no"}`);
console.log(`- migrations present: ${migrationCount}`);

console.log("\nRecommended commands:");
console.log("- pnpm prisma:generate");
console.log("- pnpm typecheck");
console.log("- pnpm build");

console.log("\nNotes:");
if (provider === "prisma-client-js" && !hasOutput) {
  console.log("- Current schema uses prisma-client-js without a custom output path. That is valid today, but Prisma documents an explicit output path requirement for the newer prisma-client generator in Prisma ORM 7.");
}
if (migrationCount === 0) {
  console.log("- No prisma/migrations directory is present. If the schema changed structurally, create a migration instead of relying only on generate.");
} else {
  console.log("- A migrations directory exists. Use prisma migrate dev for structural schema changes in development and migrate deploy in deployment environments.");
}
