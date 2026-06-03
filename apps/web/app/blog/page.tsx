import type { Metadata } from "next";
import { prisma } from "@nivertotal/db";
import { Clock, BookOpen } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Blog — Reflexões, Tradições e Significados dos Aniversários",
  description:
    "Artigos editoriais sobre o significado das datas, etiqueta do aniversário, presentes, celebração e relações afetivas. Leitura aprofundada do Portal Soma.",
  alternates: { canonical: "https://www.portalsoma.com.br/blog/" },
  openGraph: {
    title: "Blog Portal Soma — Reflexões sobre Aniversário",
    description: "Conteúdo editorial aprofundado sobre datas, presentes e relações.",
    url: "https://www.portalsoma.com.br/blog/",
    type: "website",
  },
};

async function getBlogData() {
  const [categorias, postsRecentes] = await Promise.all([
    prisma.blogCategory.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
      include: {
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publicadoEm: "desc" },
      take: 12,
      include: {
        categoria: true,
        autor: { select: { nome: true, slug: true } },
        imagemHero: true,
      },
    }),
  ]);
  return { categorias, postsRecentes };
}

export default async function BlogIndex() {
  const data = await getBlogData();
  const totalPosts = data.categorias.reduce((sum, c) => sum + c._count.posts, 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": "https://www.portalsoma.com.br/blog/",
            name: "Blog Portal Soma",
            description: "Conteúdo editorial sobre aniversários, datas, presentes e relações.",
            url: "https://www.portalsoma.com.br/blog/",
            publisher: {
              "@type": "Organization",
              name: "Portal Soma",
              url: "https://www.portalsoma.com.br/",
            },
          }),
        }}
      />

      <section className="relative bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-12 sm:py-16 deco-confetti overflow-hidden">
        <div className="container-wide relative">
          <nav className="text-sm text-stone-500 mb-4 flex items-center gap-2">
            <a href="/" className="hover:text-niver-700">Início</a>
            <span>›</span>
            <span className="text-stone-700">Blog</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-5xl text-niver-800 leading-tight max-w-3xl mb-4">
            Blog: o significado por trás de cada aniversário
          </h1>
          <p className="text-stone-700 leading-relaxed max-w-2xl text-lg">
            Reflexões editoriais sobre datas, tradições, presentes e relações.
            {totalPosts > 0 && ` ${totalPosts} artigos publicados em ${data.categorias.length} categorias.`}
          </p>
        </div>
      </section>

      {data.categorias.length > 0 && (
        <section className="container-wide py-12">
          <h2 className="heading-section-bar mb-6">
            <BookOpen size={22} className="text-niver-600" strokeWidth={2.4} />
            <span>Categorias</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.categorias.map((cat) => (
              <a
                key={cat.id}
                href={`/blog/${cat.slug}/`}
                className="card-feature p-6 hover:border-niver-300 hover:shadow-lg transition-all group"
              >
                <h3 className="font-display text-xl text-niver-800 group-hover:text-niver-700 mb-2">
                  {cat.nome}
                </h3>
                {cat.descricao && (
                  <p className="text-stone-600 text-sm leading-relaxed mb-3 line-clamp-3">
                    {cat.descricao}
                  </p>
                )}
                <div className="text-xs text-niver-600 font-medium">
                  {cat._count.posts} {cat._count.posts === 1 ? "artigo" : "artigos"} →
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {data.postsRecentes.length > 0 ? (
        <section className="container-wide py-12">
          <h2 className="heading-section-bar mb-6">
            <Clock size={22} className="text-rose-500" strokeWidth={2.4} />
            <span>Mais recentes</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.postsRecentes.map((post) => (
              <article
                key={post.id}
                itemScope
                itemType="https://schema.org/BlogPosting"
                className="card-feature overflow-hidden hover:shadow-lg transition-all group"
              >
                {post.imagemHero && (
                  <a href={`/blog/${post.categoria.slug}/${post.slug}/`} className="block aspect-[16/9] overflow-hidden bg-warm-200">
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
                  <div className="text-xs text-niver-700 font-medium mb-2">
                    <a href={`/blog/${post.categoria.slug}/`} className="hover:underline">
                      {post.categoria.nome}
                    </a>
                  </div>
                  <a href={`/blog/${post.categoria.slug}/${post.slug}/`}>
                    <h3
                      itemProp="headline"
                      className="font-display text-lg text-stone-900 leading-tight mb-2 group-hover:text-niver-700"
                    >
                      {post.titulo}
                    </h3>
                  </a>
                  {post.resumo && (
                    <p
                      itemProp="description"
                      className="text-sm text-stone-600 leading-relaxed line-clamp-3"
                    >
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
        </section>
      ) : (
        <section className="container-wide py-16 text-center">
          <BookOpen size={48} className="mx-auto text-niver-200 mb-4" />
          <h2 className="font-display text-xl text-stone-700 mb-2">
            Em breve, conteúdo editorial completo
          </h2>
          <p className="text-stone-600 max-w-md mx-auto">
            Nossa equipe está preparando artigos profundos sobre o significado dos aniversários,
            tradições culturais, presentes e relações. Volte em breve.
          </p>
        </section>
      )}
    </>
  );
}
