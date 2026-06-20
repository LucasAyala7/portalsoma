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
  //
  // Markdown endpoint (GEO): /<path>.md → /api/md?path=/<path>/
  // Funciona melhor que middleware rewrite pra URLs com extensão.
  async rewrites() {
    return [
      {
        source: "/sitemap-mensagens-:n(\\d+).xml",
        destination: "/sitemap-mensagens/:n",
      },
      {
        source: "/:n1/.md",
        destination: "/api/md?path=/:n1/",
      },
      {
        source: "/:n1/:n2/.md",
        destination: "/api/md?path=/:n1/:n2/",
      },
      {
        source: "/:n1/:n2/:n3/.md",
        destination: "/api/md?path=/:n1/:n2/:n3/",
      },
    ];
  },
  // Cache CDN agressivo — todas as páginas HTML cacheadas 1 dia em edge CF,
  // 7 dias de stale-while-revalidate (CF serve stale enquanto refetcha do origin).
  // API routes mantêm no-store via export individuais.
  async headers() {
    return [
      {
        // Mensagens single + cluster + autor + blog: cache super longo, refetch async
        source: "/((?!api|_next|admin).*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=86400",
          },
          {
            key: "Cloudflare-CDN-Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        // API routes: nunca cacheia
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default config;
