import { prisma } from "@nivertotal/db";
import {
  SITEMAP_HEADERS,
  SITE_URL,
  type SitemapUrl,
  renderUrlset,
} from "../../lib/sitemap-utils";

/**
 * /sitemap-web-stories.xml — Web Stories AMP publicadas.
 *
 * Pode estar vazio enquanto fábrica de Web Stories não roda — estrutura
 * fica pronta pra Google descobrir assim que primeira história sair.
 */

export const revalidate = 30;
export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const stories = await prisma.webStory.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, atualizadoEm: true },
  });

  const urls: SitemapUrl[] = stories.map((s) => ({
    loc: `${SITE_URL}/web-stories/${s.slug}/`,
    lastmod: s.atualizadoEm,
    changefreq: "weekly",
    priority: 0.6,
  }));

  return new Response(renderUrlset(urls), { headers: SITEMAP_HEADERS });
}
