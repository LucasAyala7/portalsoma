/**
 * Helpers compartilhados pra geração de sitemaps XML fragmentados.
 *
 * Estratégia: sitemap index (`/sitemap.xml`) aponta pra sub-sitemaps temáticos
 * (clusters, mensagens paginadas, autores, web stories). Cada sub-sitemap
 * carrega no máximo 5000 URLs — limite Google é 50k, mas fragmentar mais
 * acelera descoberta e re-crawl seletivo.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://portalsoma.com.br";

export const MAX_URLS_PER_SITEMAP = 5000;

export type SitemapUrl = {
  loc: string;
  lastmod?: Date | string | null;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(input: Date | string | null | undefined): string | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Renderiza um <urlset> a partir de uma lista de URLs.
 */
export function renderUrlset(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts: string[] = [`    <loc>${escapeXml(u.loc)}</loc>`];
      const lastmod = formatDate(u.lastmod);
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (typeof u.priority === "number") {
        parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

/**
 * Renderiza um <sitemapindex> apontando pra sub-sitemaps.
 */
export function renderSitemapIndex(
  entries: { loc: string; lastmod?: Date | string | null }[],
): string {
  const body = entries
    .map((e) => {
      const lastmod = formatDate(e.lastmod);
      const parts = [`    <loc>${escapeXml(e.loc)}</loc>`];
      if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

/**
 * Headers padrão pra resposta XML de sitemap.
 * Cache curto pra permitir re-crawl rápido após autopublisher rodar.
 */
export const SITEMAP_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=30, s-maxage=30, stale-while-revalidate=60",
} as const;
