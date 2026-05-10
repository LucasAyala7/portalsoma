import { prisma } from "@nivertotal/db";
import {
  SITEMAP_HEADERS,
  SITE_URL,
  type SitemapUrl,
  renderUrlset,
} from "../../lib/sitemap-utils";

/**
 * /sitemap-clusters.xml — raiz + nichos + clusters + complementos.
 *
 * Esse sub-sitemap concentra as páginas "hub" do silo:
 *  - Home
 *  - /[nicho]/                                (ex: /mensagem-de-aniversario/)
 *  - /[nicho]/[cluster]/                      (ex: /mensagem-de-aniversario/para-mae/)
 *  - /[nicho]/[cluster]/[complemento]/        (ex: .../para-mae/evangelica/)
 */

export const revalidate = 30;
export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const [nichos, clusters, complementos] = await Promise.all([
    prisma.nicho.findMany({
      where: { ativo: true },
      select: { slug: true, atualizadoEm: true },
    }),
    prisma.cluster.findMany({
      where: { ativo: true },
      select: {
        slug: true,
        atualizadoEm: true,
        volumeMensal: true,
        nicho: { select: { slug: true } },
      },
    }),
    prisma.complemento.findMany({
      where: { ativo: true },
      select: {
        slug: true,
        atualizadoEm: true,
        cluster: {
          select: { slug: true, nicho: { select: { slug: true } } },
        },
      },
    }),
  ]);

  const urls: SitemapUrl[] = [
    {
      loc: `${SITE_URL}/`,
      changefreq: "daily",
      priority: 1.0,
    },
  ];

  for (const n of nichos) {
    urls.push({
      loc: `${SITE_URL}/${n.slug}/`,
      lastmod: n.atualizadoEm,
      changefreq: "daily",
      priority: 0.95,
    });
  }

  for (const c of clusters) {
    urls.push({
      loc: `${SITE_URL}/${c.nicho.slug}/${c.slug}/`,
      lastmod: c.atualizadoEm,
      changefreq: "daily",
      priority: c.volumeMensal > 10000 ? 0.9 : 0.8,
    });
  }

  for (const cp of complementos) {
    urls.push({
      loc: `${SITE_URL}/${cp.cluster.nicho.slug}/${cp.cluster.slug}/${cp.slug}/`,
      lastmod: cp.atualizadoEm,
      changefreq: "weekly",
      priority: 0.7,
    });
  }

  return new Response(renderUrlset(urls), { headers: SITEMAP_HEADERS });
}
