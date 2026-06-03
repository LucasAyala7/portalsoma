import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@nivertotal/db";
import { PostEditor } from "../PostEditor";
import { criarPost } from "./actions";

export const dynamic = "force-dynamic";

export default async function NovoPost() {
  const [categorias, autores] = await Promise.all([
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

  if (categorias.length === 0 || autores.length === 0) {
    redirect("/blog");
  }

  const equipe = autores.find((a) => a.nome.toLowerCase().includes("equipe")) ?? autores[0]!;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/blog" className="text-stone-500 hover:text-stone-900 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold flex-1">Novo post</h1>
      </div>

      <PostEditor
        isNew
        initial={{
          titulo: "",
          metaTitle: "",
          metaDescription: "",
          conteudo: "",
          resumo: "",
          slug: "",
          tags: "",
          status: "DRAFT",
          categoriaId: categorias[0]!.id,
          autorId: equipe.id,
          qualidade: null,
          origem: "MANUAL",
        }}
        categorias={categorias}
        autores={autores}
        saveAction={criarPost}
      />
    </div>
  );
}
