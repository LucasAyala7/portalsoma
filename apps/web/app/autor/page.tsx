import type { Metadata } from "next";
import { prisma } from "@nivertotal/db";
import { jsonLdScript, breadcrumbSchema } from "@/lib/seo";
import { Heart, BookOpen, Copy, Eye, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.portalsoma.com.br";

export async function generateMetadata(): Promise<Metadata> {
  const totalAutores = await prisma.author.count({ where: { ativo: true } });
  const titleAuto = `Autores — ${totalAutores} curadores e escritores do Portal Soma`;
  const descAuto = `Conheça os ${totalAutores} autores por trás das mensagens do Portal Soma. Curadoria editorial brasileira em mensagens de aniversário.`;
  return {
    title: titleAuto,
    description: descAuto,
    alternates: { canonical: `${SITE_URL}/autor/` },
    openGraph: {
      title: titleAuto,
      description: descAuto,
      url: `${SITE_URL}/autor/`,
      type: "website",
      siteName: "Portal Soma",
      locale: "pt_BR",
    },
  };
}

export default async function AutoresIndex() {
  const autores = await prisma.author.findMany({
    where: { ativo: true },
    orderBy: [{ real: "desc" }, { ordem: "asc" }, { nome: "asc" }],
    include: {
      _count: {
        select: { mensagens: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  const totalAutores = autores.length;
  const totalReais = autores.filter((a) => a.real).length;
  const totalPersonas = totalAutores - totalReais;
  const totalMensagens = autores.reduce((s, a) => s + a._count.mensagens, 0);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Autores do Portal Soma",
    numberOfItems: totalAutores,
    itemListElement: autores.slice(0, 50).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        "@id": `${SITE_URL}/autor/${a.slug}/`,
        name: a.nome,
        url: `${SITE_URL}/autor/${a.slug}/`,
        description: a.bio.slice(0, 160),
        image: a.fotoUrl ?? undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Autores", url: "/autor/" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Autores — Portal Soma",
            url: `${SITE_URL}/autor/`,
            description: `Conheça os ${totalAutores} autores por trás das mensagens do Portal Soma.`,
            inLanguage: "pt-BR",
          },
          itemList,
        ])}
      />

      <article itemScope itemType="https://schema.org/CollectionPage">
        <meta itemProp="name" content="Autores — Portal Soma" />
        <meta itemProp="inLanguage" content="pt-BR" />

        {/* Breadcrumb microdata */}
        <nav
          itemScope
          itemType="https://schema.org/BreadcrumbList"
          aria-label="Breadcrumb"
          className="container-niver pt-4 text-xs text-stone-500"
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <a href="/" itemProp="item" className="hover:text-niver-700">
                <span itemProp="name">Início</span>
              </a>
              <meta itemProp="position" content="1" />
            </li>
            <li aria-hidden className="text-stone-400">/</li>
            <li
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
              aria-current="page"
            >
              <span itemProp="name" className="text-stone-700 font-medium">
                Autores
              </span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>

        {/* HERO */}
        <header className="relative bg-gradient-to-b from-niver-50 to-warm-50 py-12 sm:py-16 overflow-hidden">
          <div className="container-niver text-center">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-medium text-niver-700 bg-niver-100 px-3 py-1.5 rounded-full mb-4">
              <Users size={12} strokeWidth={2.4} /> Curadoria editorial
            </span>
            <h1
              itemProp="headline"
              className="font-display text-3xl sm:text-5xl text-niver-900 max-w-3xl mx-auto leading-tight"
            >
              Quem escreve as mensagens do Portal Soma
            </h1>
            <p className="mt-4 text-stone-700 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              {totalAutores} autores entre escritores convidados e personas editoriais —
              cada um com voz, tom e repertório próprios. {totalMensagens.toLocaleString("pt-BR")}{" "}
              mensagens publicadas com nome assinado.
            </p>
            <div className="mt-6 inline-flex items-center gap-4 text-sm text-stone-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> {totalReais}{" "}
                {totalReais === 1 ? "autor humano" : "autores humanos"}
              </span>
              <span className="text-stone-300">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-niver-400" /> {totalPersonas}{" "}
                {totalPersonas === 1 ? "persona editorial" : "personas editoriais"}
              </span>
            </div>
          </div>
        </header>

        {/* INTRO EDITORIAL */}
        <section className="container-niver py-10 max-w-3xl">
          <p className="text-stone-700 leading-[1.85] text-[16px] sm:text-[17px]">
            O Portal Soma combina dois tipos de assinatura: <strong>autores humanos</strong>{" "}
            (escritores convidados que assumem publicamente o que escrevem) e{" "}
            <strong>personas editoriais</strong> — vozes recorrentes com tom próprio
            (avó, irmã mais velha, amiga de longa data, pastor, professora), criadas
            para que cada mensagem tenha uma cadência específica e não soe igual a
            todas as outras. Toda mensagem traz autor declarado para você saber de
            onde aquela voz vem.
          </p>
        </section>

        {/* GRID AUTORES */}
        <section className="container-niver py-8" id="lista-autores">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {autores.map((a) => (
              <a
                key={a.id}
                href={`/autor/${a.slug}/`}
                className="group flex items-start gap-4 p-5 rounded-2xl bg-white border border-stone-100 hover:border-niver-200 hover:shadow-md transition-all"
              >
                {a.fotoUrl ? (
                  <img
                    src={a.fotoUrl}
                    alt={a.nome}
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-stone-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-niver-50 grid place-items-center flex-shrink-0">
                    <Users size={22} className="text-niver-400" strokeWidth={1.8} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="font-display text-lg text-stone-900 group-hover:text-niver-700 transition-colors truncate">
                      {a.nome}
                    </h2>
                    {a.real ? (
                      <span className="text-[10px] uppercase tracking-wide font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Humano
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wide font-medium text-niver-700 bg-niver-50 px-1.5 py-0.5 rounded">
                        Persona
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 inline-flex items-center gap-1">
                    <BookOpen size={11} strokeWidth={2.4} />
                    {a._count.mensagens.toLocaleString("pt-BR")}{" "}
                    {a._count.mensagens === 1 ? "mensagem" : "mensagens"}
                  </p>
                  <p className="text-sm text-stone-600 mt-2 line-clamp-2 leading-snug">
                    {a.bio.slice(0, 140)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </article>
    </>
  );
}
