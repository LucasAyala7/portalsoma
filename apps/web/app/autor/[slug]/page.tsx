import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@nivertotal/db";
import { jsonLdScript, breadcrumbSchema, profilePageSchema } from "@/lib/seo";
import { mensagemUrl } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

// Dynamic + CDN cache 1 dia
export const dynamic = "force-dynamic";
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const autor = await prisma.author.findUnique({ where: { slug, ativo: true } });
  if (!autor) return {};
  return {
    title: `${autor.nome} · Autor no Portal Soma`,
    description: autor.bio.slice(0, 155),
    alternates: { canonical: `/autor/${slug}/` },
  };
}

export default async function AutorPage({ params }: Props) {
  const { slug } = await params;
  const autor = await prisma.author.findUnique({
    where: { slug, ativo: true },
    include: {
      mensagens: {
        where: { status: "PUBLISHED" },
        orderBy: { publicadoEm: "desc" },
        take: 60,
        include: { cluster: { include: { nicho: true } } },
      },
    },
  });

  if (!autor) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript([
          breadcrumbSchema([
            { name: "Início", url: "/" },
            { name: "Autores", url: "/autor/" },
            { name: autor.nome, url: `/autor/${autor.slug}/` },
          ]),
          profilePageSchema({
            nome: autor.nome,
            bio: autor.bio,
            fotoUrl: autor.fotoUrl,
            slug: autor.slug,
            redes: autor.redes as Record<string, string> | null,
          }),
        ])}
      />

      <section className="bg-niver-50 py-12">
        <div
          itemScope
          itemType="https://schema.org/Person"
          className="container-niver flex flex-col sm:flex-row gap-6 items-center sm:items-start"
        >
          {autor.fotoUrl ? (
            <img
              itemProp="image"
              src={autor.fotoUrl}
              alt={autor.nome}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-niver-200 grid place-items-center text-4xl font-display text-niver-700">
              {autor.nome.slice(0, 1)}
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 itemProp="name" className="text-3xl text-niver-800">
              {autor.nome}
            </h1>
            {autor.real && (
              <span className="inline-block mt-1 text-xs bg-white px-2 py-0.5 rounded-full text-stone-600">
                Editor
              </span>
            )}
            <p itemProp="description" className="mt-4 text-stone-700 max-w-2xl leading-relaxed">
              {autor.bio}
            </p>
          </div>
        </div>
      </section>

      <section className="container-niver py-10">
        <h2 className="text-2xl mb-6">Mensagens de {autor.nome}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {autor.mensagens.map((m) => (
            <a
              key={m.id}
              href={mensagemUrl({
                nichoSlug: m.cluster.nicho.slug,
                clusterSlug: m.cluster.slug,
                slug: m.slug,
              })}
              className="card-message p-5 hover:border-niver-200"
            >
              <p className="text-stone-700 line-clamp-4 text-sm leading-relaxed">{m.conteudo}</p>
              <div className="mt-3 text-xs text-stone-500">{m.cluster.nome}</div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
