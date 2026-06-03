import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@nivertotal/db";
import { PostEditor } from "../PostEditor";
import { salvarPost, publicarPost, despublicarPost, deletarPost } from "./actions";
import { stringifyTags } from "../utils";

export const dynamic = "force-dynamic";

export default async function EditarPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [p, categorias, autores] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: {
        categoria: { select: { slug: true, nome: true } },
        autor: { select: { nome: true } },
        imagemHero: { select: { url: true, alt: true, modelo: true, custo: true } },
        imagemOg: { select: { url: true, alt: true, modelo: true } },
      },
    }),
    prisma.blogCategory.findMany({
      where: { ativo: true },
      select: { id: true, slug: true, nome: true },
      orderBy: { ordem: "asc" },
    }),
    prisma.author.findMany({
      where: { ativo: true },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  if (!p) notFound();

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/blog" className="text-stone-500 hover:text-stone-900 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold flex-1 truncate">Editar post</h1>
      </div>

      {(p.imagemHero || p.imagemOg) && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-3">Mídia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.imagemHero && (
              <div>
                <div className="text-xs text-stone-500 mb-1.5">
                  Hero · {p.imagemHero.modelo}
                  {p.imagemHero.custo ? ` · R$ ${p.imagemHero.custo.toFixed(2)}` : ""}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imagemHero.url} alt={p.imagemHero.alt} className="rounded-lg border border-stone-200 w-full" />
              </div>
            )}
            {p.imagemOg && (
              <div>
                <div className="text-xs text-stone-500 mb-1.5">OG (compartilhamento) · {p.imagemOg.modelo}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imagemOg.url} alt={p.imagemOg.alt} className="rounded-lg border border-stone-200 w-full" />
              </div>
            )}
          </div>
        </div>
      )}

      <PostEditor
        initial={{
          id: p.id,
          titulo: p.titulo,
          metaTitle: p.metaTitle ?? "",
          metaDescription: p.metaDescription ?? "",
          conteudo: p.conteudo,
          resumo: p.resumo ?? "",
          slug: p.slug,
          tags: stringifyTags(p.tags),
          status: p.status,
          categoriaId: p.categoriaId,
          autorId: p.autorId,
          qualidade: p.qualidade,
          origem: p.origem,
        }}
        categorias={categorias}
        autores={autores}
        saveAction={salvarPost}
        publishAction={publicarPost}
        unpublishAction={despublicarPost}
        deleteAction={deletarPost}
      />
    </div>
  );
}
