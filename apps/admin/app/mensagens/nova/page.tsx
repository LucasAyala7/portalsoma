import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@nivertotal/db";
import { MensagemEditor } from "../MensagemEditor";
import { criarMensagem } from "./actions";

export const dynamic = "force-dynamic";

export default async function NovaMensagem() {
  const [clusters, complementos, personas, autores] = await Promise.all([
    prisma.cluster.findMany({ where: { ativo: true }, select: { id: true, slug: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.complemento.findMany({ where: { ativo: true }, select: { id: true, nome: true, clusterId: true }, orderBy: { nome: "asc" } }),
    prisma.persona.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.author.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  if (clusters.length === 0 || autores.length === 0) {
    redirect("/clusters");
  }

  const equipe = autores.find((a) => a.nome.toLowerCase().includes("equipe")) ?? autores[0]!;

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mensagens" className="text-stone-500 hover:text-stone-900 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold flex-1">Nova mensagem</h1>
      </div>

      <MensagemEditor
        isNew
        initial={{
          titulo: "",
          metaTitle: "",
          metaDescription: "",
          conteudo: "",
          resumo: "",
          slug: "",
          tipo: "MEDIA",
          tier: "TIER_3",
          status: "DRAFT",
          clusterId: clusters[0]!.id,
          complementoId: null,
          personaId: null,
          autorId: equipe.id,
          qualidade: null,
        }}
        clusters={clusters}
        complementos={complementos}
        personas={personas}
        autores={autores}
        saveAction={criarMensagem}
      />
    </div>
  );
}
