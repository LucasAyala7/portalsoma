import { prisma } from "@nivertotal/db";
import {
  SITEMAP_HEADERS,
  SITE_URL,
  type SitemapUrl,
  renderUrlset,
} from "../../lib/sitemap-utils";

/**
 * /sitemap-autores.xml — páginas de autores ativos.
 */

export const revalidate = 30;
export const runtime = "nodejs";

export async function GET() {
  const autores = await prisma.author.findMany({
    where: { ativo: true },
    select: { slug: true, atualizadoEm: true },
  });

  const urls: SitemapUrl[] = autores.map((a) => ({
    loc: `${SITE_URL}/autor/${a.slug}/`,
    lastmod: a.atualizadoEm,
    changefreq: "weekly",
    priority: 0.5,
  }));

  return new Response(renderUrlset(urls), { headers: SITEMAP_HEADERS });
}
