import type { NextConfig } from "next";

const config: NextConfig = {
  trailingSlash: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
    "@nivertotal/db",
    "@nivertotal/ai",
    "@nivertotal/images",
    "@nivertotal/ingest",
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.portalsoma.com.br",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
  poweredByHeader: false,
  generateBuildId: async () => {
    return process.env.BUILD_ID ?? `build-${Date.now()}`;
  },
  // Sitemap fragmentado: rewrite das URLs públicas pra rota dinâmica interna.
  // Public: /sitemap-mensagens-1.xml  →  Internal: /sitemap-mensagens/1
  async rewrites() {
    return [
      {
        source: "/sitemap-mensagens-:n(\\d+).xml",
        destination: "/sitemap-mensagens/:n",
      },
    ];
  },
};

export default config;
