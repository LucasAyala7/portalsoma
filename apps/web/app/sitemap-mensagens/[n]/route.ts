import { prisma } from "@nivertotal/db";
import {
  MAX_URLS_PER_SITEMAP,
  SITEMAP_HEADERS,
  SITE_URL,
  type SitemapUrl,
  renderUrlset,
} from "../../../lib/sitemap-utils";

/**
 * /sitemap-mensagens-{n}.xml — sub-sitemap paginado de mensagens publicadas.
 *
 * Cada página carrega no máximo MAX_URLS_PER_SITEMAP (5000) URLs. O sitemap
 * index calcula quantas páginas existem com base em `count(Mensagem)`. A
 * URL pública é `/sitemap-mensagens-1.xml`, `/sitemap-mensagens-2.xml`, …
 * mas internamente o Next roteia via dynamic segment `[n]`.
 *
 * Rewrite configurado em `next.config.ts`:
 *   /sitemap-mensagens-:n.xml  →  /sitemap-mensagens/:n
 */

export const revalidate = 30;
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ n: string }> },
) {
  const { n: rawN } = await params;
  const page = Number.parseInt(rawN, 10);

  if (!Number.isFinite(page) || page < 1) {
    return new Response("Sitemap page not found", { status: 404 });
  }

  const skip = (page - 1) * MAX_URLS_PER_SITEMAP;

  const mensagens = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      atualizadoEm: true,
      cluster: {
        select: {
          slug: true,
          nicho: { select: { slug: true } },
        },
      },
    },
    orderBy: { id: "asc" }, // ordem estável pra paginação não duplicar/pular URL
    skip,
    take: MAX_URLS_PER_SITEMAP,
  });

  if (mensagens.length === 0 && page > 1) {
    return new Response("Sitemap page not found", { status: 404 });
  }

  const urls: SitemapUrl[] = mensagens.map((m) => ({
    loc: `${SITE_URL}/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/`,
    lastmod: m.atualizadoEm,
    changefreq: "monthly",
    priority: 0.6,
  }));

  return new Response(renderUrlset(urls), { headers: SITEMAP_HEADERS });
}
