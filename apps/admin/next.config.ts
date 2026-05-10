import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
    "@nivertotal/db",
    "@nivertotal/ai",
    "@nivertotal/images",
    "@nivertotal/ingest",
  ],
};

export default config;
