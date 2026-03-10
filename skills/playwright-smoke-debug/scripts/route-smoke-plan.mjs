#!/usr/bin/env node

import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const appDir = path.join(process.cwd(), "app");

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name === "page.tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

function toRoute(filePath) {
  const relative = path.relative(appDir, filePath).replace(/\\/g, "/");
  const segments = relative.split("/").slice(0, -1);
  const clean = segments.filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"));
  const route = `/${clean.join("/")}`.replace(/\/+/g, "/");
  return route === "/" ? "/" : route.replace(/\/$/, "") || "/";
}

try {
  if (!statSync(appDir).isDirectory()) {
    throw new Error("app directory is not a folder");
  }
} catch (error) {
  console.error(`Unable to inspect ${appDir}: ${error.message}`);
  process.exit(1);
}

const routes = [...new Set(walk(appDir).map(toRoute))].sort();
const staticRoutes = routes.filter((route) => !route.includes("["));
const dynamicRoutes = routes.filter((route) => route.includes("["));

console.log("Static routes to smoke first:");
for (const route of staticRoutes) {
  console.log(`- ${route}`);
}

if (dynamicRoutes.length > 0) {
  console.log("\nDynamic routes that need fixture data or seeded ids:");
  for (const route of dynamicRoutes) {
    console.log(`- ${route}`);
  }
}

console.log("\nSuggested first smoke set:");
for (const route of staticRoutes.slice(0, 5)) {
  console.log(`- ${route}`);
}
