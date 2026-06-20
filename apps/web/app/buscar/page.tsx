import type { Metadata } from "next";
import { prisma } from "@nivertotal/db";
import { mensagemUrl } from "@/lib/utils";
import { jsonLdScript, breadcrumbSchema, enrichedItemListSchema, type ArticleListEntry } from "@/lib/seo";
import { MessageCardCompact } from "@/components/message-card-compact";
import { Search, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  // Title sem suffix "| Portal Soma" · layout.tsx template já adiciona automaticamente.
  if (!query) {
    return {
      title: "Buscar mensagens",
      description: "Encontre mensagens de aniversário por palavra-chave, autor, ocasião ou estilo.",
      alternates: { canonical: `${SITE_URL}/buscar/` },
      openGraph: {
        title: "Buscar mensagens · Portal Soma",
        description: "Encontre mensagens de aniversário por palavra-chave, autor, ocasião ou estilo.",
        url: `${SITE_URL}/buscar/`,
        type: "website",
        siteName: "Portal Soma",
        locale: "pt_BR",
      },
    };
  }
  const fullUrl = `${SITE_URL}/buscar/?q=${encodeURIComponent(query)}`;
  return {
    title: `"${query}" · Resultados de busca`,
    description: `Resultados da busca por "${query}" em mensagens de aniversário do Portal Soma.`,
    alternates: { canonical: fullUrl },
    robots: { index: false, follow: true },
    openGraph: {
      title: `"${query}" · Resultados de busca · Portal Soma`,
      description: `Resultados da busca por "${query}" em mensagens de aniversário do Portal Soma.`,
      url: fullUrl,
      type: "website",
      siteName: "Portal Soma",
      locale: "pt_BR",
    },
  };
}

async function searchMensagens(q: string) {
  if (!q) return [];
  return prisma.mensagem.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { titulo: { contains: q, mode: "insensitive" } },
        { conteudo: { contains: q, mode: "insensitive" } },
        { resumo: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ likes: "desc" }, { publicadoEm: "desc" }],
    take: 60,
    include: {
      autor: { select: { nome: true, slug: true } },
      cluster: {
        select: { slug: true, nome: true, nicho: { select: { slug: true } } },
      },
    },
  });
}

export default async function Buscar({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  const results = await searchMensagens(query);

  const itemListSchemaData: ArticleListEntry[] = results.slice(0, 30).map((m, idx) => ({
    position: idx + 1,
    url: mensagemUrl({
      nichoSlug: m.cluster.nicho.slug,
      clusterSlug: m.cluster.slug,
      slug: m.slug,
    }),
    titulo: m.titulo,
    resumo: m.resumo,
    autorNome: m.autor.nome,
    autorUrl: `/autor/${m.autor.slug}/`,
    publicadoEm: m.publicadoEm,
    likes: m.likes,
    copies: m.copies,
    shares: m.shares,
    visualizacoes: m.visualizacoes,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Buscar", url: "/buscar/" },
          ]),
          ...(results.length > 0 ? [enrichedItemListSchema(itemListSchemaData)] : []),
        ])}
      />

      <section className="relative bg-gradient-to-b from-niver-50 via-warm-100 to-warm-50 py-10 sm:py-14 border-b border-warm-200/40">
        <div className="container-niver">
          <nav className="text-sm text-stone-500 mb-4 flex items-center gap-2">
            <a href="/" className="hover:text-niver-700">Início</a>
            <ChevronRight size={14} />
            <span className="text-stone-700">Buscar</span>
          </nav>
          <h1 className="font-display text-3xl sm:text-4xl text-niver-800 leading-tight mb-4">
            {query ? <>Resultados para "<span className="text-niver-600">{query}</span>"</> : "Buscar no Portal Soma"}
          </h1>
          <form id="site-search" action="/buscar/" method="get" role="search" className="max-w-2xl">
            <label htmlFor="site-search-input" className="sr-only">Buscar mensagens</label>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                id="site-search-input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Digite uma palavra, frase ou tema…"
                className="w-full h-12 pl-12 pr-32 rounded-full bg-white border border-stone-200 focus:border-niver-400 focus:outline-none focus:ring-2 focus:ring-niver-100 text-base"
                autoComplete="off"
                spellCheck
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full bg-niver-600 text-white text-sm font-medium hover:bg-niver-700"
              >
                Buscar
              </button>
            </div>
          </form>
          {query && (
            <p className="mt-4 text-stone-600 text-sm">
              {results.length === 0
                ? "Nenhuma mensagem encontrada. Tente outras palavras."
                : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
            </p>
          )}
        </div>
      </section>

      {results.length > 0 && (
        <section className="container-niver py-10">
          <div className="space-y-3">
            {results.map((m, i) => (
              <MessageCardCompact
                key={m.id}
                mensagem={{
                  id: m.id,
                  slug: m.slug,
                  titulo: m.titulo,
                  conteudo: m.conteudo,
                  likes: m.likes,
                  copies: m.copies,
                  autor: { nome: m.autor.nome, slug: m.autor.slug },
                  cluster: {
                    slug: m.cluster.slug,
                    nome: m.cluster.nome,
                    nicho: { slug: m.cluster.nicho.slug },
                  },
                }}
                nichoSlug={m.cluster.nicho.slug}
                index={i}
              />
            ))}
          </div>
        </section>
      )}

      {!query && (
        <section className="container-niver py-10">
          <div className="card-feature p-8 text-center">
            <Search size={40} className="mx-auto text-niver-300 mb-3" />
            <p className="text-stone-600 max-w-md mx-auto">
              Digite acima uma palavra ou frase para encontrar mensagens. Você pode buscar por temas (evangélica, engraçada), destinatário (mãe, amiga), ocasião (15 anos) ou trechos do texto.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
