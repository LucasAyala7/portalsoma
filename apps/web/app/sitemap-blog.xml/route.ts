import { prisma } from "@nivertotal/db";

export const dynamic = "force-dynamic";
export const revalidate = 300;

const SITE = "https://www.portalsoma.com.br";

export async function GET() {
  const [categorias, posts] = await Promise.all([
    prisma.blogCategory.findMany({
      where: { ativo: true },
      select: { slug: true, atualizadoEm: true },
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { atualizadoEm: "desc" },
      select: {
        slug: true,
        atualizadoEm: true,
        publicadoEm: true,
        categoria: { select: { slug: true } },
      },
    }),
  ]);

  const urls: string[] = [];
  urls.push(
    `<url><loc>${SITE}/blog/</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
  );
  for (const c of categorias) {
    urls.push(
      `<url><loc>${SITE}/blog/${c.slug}/</loc><lastmod>${c.atualizadoEm.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    );
  }
  for (const p of posts) {
    const last = (p.atualizadoEm ?? p.publicadoEm ?? new Date()).toISOString();
    urls.push(
      `<url><loc>${SITE}/blog/${p.categoria.slug}/${p.slug}/</loc><lastmod>${last}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
