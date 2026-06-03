import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@nivertotal/db";
import { Clock, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ categoria: string }>;
}

async function loadCategoria(slug: string) {
  return prisma.blogCategory.findFirst({
    where: { slug, ativo: true },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { publicadoEm: "desc" },
        include: {
          autor: { select: { nome: true, slug: true } },
          imagemHero: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categoria } = await params;
  const cat = await loadCategoria(categoria);
  if (!cat) return {};
  return {
    title: cat.metaTitle ?? `${cat.nome} — Blog Portal Soma`,
    description: cat.metaDesc ?? cat.descricao ?? undefined,
    alternates: { canonical: `https://www.portalsoma.com.br/blog/${cat.slug}/` },
  };
}

export default async function CategoriaBlog({ params }: PageProps) {
  const { categoria } = await params;
  const cat = await loadCategoria(categoria);
  if (!cat) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Início", item: "https://www.portalsoma.com.br/" },
                { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.portalsoma.com.br/blog/" },
                { "@type": "ListItem", position: 3, name: cat.nome, item: `https://www.portalsoma.com.br/blog/${cat.slug}/` },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: cat.nome,
              description: cat.descricao ?? `Artigos sobre ${cat.nome.toLowerCase()}`,
              url: `https://www.portalsoma.com.br/blog/${cat.slug}/`,
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: cat.posts.slice(0, 30).map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `https://www.portalsoma.com.br/blog/${cat.slug}/${p.slug}/`,
                name: p.titulo,
              })),
            },
          ]),
        }}
      />

      <section className="relative bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-12 sm:py-16 overflow-hidden">
        <div className="container-wide relative">
          <nav className="text-sm text-stone-500 mb-4 flex items-center gap-2 flex-wrap">
            <a href="/" className="hover:text-niver-700">Início</a>
            <ChevronRight size={14} />
            <a href="/blog/" className="hover:text-niver-700">Blog</a>
            <ChevronRight size={14} />
            <span className="text-stone-700">{cat.nome}</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-5xl text-niver-800 leading-tight max-w-3xl mb-4">
            {cat.nome}
          </h1>
          {(cat.intro || cat.descricao) && (
            <p className="text-stone-700 leading-relaxed max-w-2xl text-lg whitespace-pre-line">
              {cat.intro ?? cat.descricao}
            </p>
          )}
        </div>
      </section>

      <section className="container-wide py-12">
        {cat.posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cat.posts.map((post) => (
              <article
                key={post.id}
                itemScope
                itemType="https://schema.org/BlogPosting"
                className="card-feature overflow-hidden hover:shadow-lg transition-all group"
              >
                {post.imagemHero && (
                  <a href={`/blog/${cat.slug}/${post.slug}/`} className="block aspect-[16/9] overflow-hidden bg-warm-200">
                    <img
                      src={post.imagemHero.url}
                      alt={post.imagemHero.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      itemProp="image"
                    />
                  </a>
                )}
                <div className="p-5">
                  <a href={`/blog/${cat.slug}/${post.slug}/`}>
                    <h3
                      itemProp="headline"
                      className="font-display text-lg text-stone-900 leading-tight mb-2 group-hover:text-niver-700"
                    >
                      {post.titulo}
                    </h3>
                  </a>
                  {post.resumo && (
                    <p itemProp="description" className="text-sm text-stone-600 leading-relaxed line-clamp-3">
                      {post.resumo}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
                    <span itemProp="author" itemScope itemType="https://schema.org/Person">
                      por <span itemProp="name" className="text-stone-700 font-medium">{post.autor.nome}</span>
                    </span>
                    {post.tempoLeitura && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {post.tempoLeitura} min
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="card-feature p-12 text-center">
            <p className="text-stone-600">Em breve, artigos nesta categoria.</p>
          </div>
        )}
      </section>
    </>
  );
}
