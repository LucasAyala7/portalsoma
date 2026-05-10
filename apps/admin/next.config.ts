import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: true,
  transpilePackages: [
    "@nivertotal/db",
    "@nivertotal/ai",
    "@nivertotal/images",
    "@nivertotal/ingest",
  ],
};

export default config;
