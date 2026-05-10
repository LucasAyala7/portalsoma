import { prisma } from "@nivertotal/db";
import {
  MAX_URLS_PER_SITEMAP,
  SITEMAP_HEADERS,
  SITE_URL,
  renderSitemapIndex,
} from "../../lib/sitemap-utils";

/**
 * Sitemap index — `/sitemap.xml`
 *
 * Aponta pra sub-sitemaps fragmentados pra Google indexar mais rápido e
 * re-crawlear seletivamente quando algum cluster/mensagem é atualizado.
 *
 * Sub-sitemaps:
 *  - /sitemap-clusters.xml         (raiz + nichos + clusters + complementos)
 *  - /sitemap-mensagens-{n}.xml    (5000 URLs/sitemap, paginação dinâmica)
 *  - /sitemap-autores.xml
 *  - /sitemap-web-stories.xml
 */

export const revalidate = 30;
export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const [totalMensagens, latestMensagem, latestCluster, latestAutor, latestWebStory] =
    await Promise.all([
      prisma.mensagem.count({ where: { status: "PUBLISHED" } }),
      prisma.mensagem.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true },
      }),
      prisma.cluster.findFirst({
        where: { ativo: true },
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true },
      }),
      prisma.author.findFirst({
        where: { ativo: true },
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true },
      }),
      prisma.webStory.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { atualizadoEm: "desc" },
        select: { atualizadoEm: true },
      }),
    ]);

  const totalPaginasMensagens = Math.max(
    1,
    Math.ceil(totalMensagens / MAX_URLS_PER_SITEMAP),
  );

  const entries: { loc: string; lastmod?: Date | string | null }[] = [
    {
      loc: `${SITE_URL}/sitemap-clusters.xml`,
      lastmod: latestCluster?.atualizadoEm ?? new Date(),
    },
  ];

  for (let n = 1; n <= totalPaginasMensagens; n++) {
    entries.push({
      loc: `${SITE_URL}/sitemap-mensagens-${n}.xml`,
      lastmod: latestMensagem?.atualizadoEm ?? new Date(),
    });
  }

  entries.push(
    {
      loc: `${SITE_URL}/sitemap-autores.xml`,
      lastmod: latestAutor?.atualizadoEm ?? new Date(),
    },
    {
      loc: `${SITE_URL}/sitemap-web-stories.xml`,
      lastmod: latestWebStory?.atualizadoEm ?? new Date(),
    },
  );

  return new Response(renderSitemapIndex(entries), {
    headers: SITEMAP_HEADERS,
  });
}
