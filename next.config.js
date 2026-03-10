// @ts-check

const path = require("path");

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      "lucide-react": "lucide-react/dist/esm/lucide-react.js",
    },
  },
};

module.exports = nextConfig;
