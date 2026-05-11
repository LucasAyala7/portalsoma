import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@nivertotal/db";
import { MensagemEditor } from "../MensagemEditor";
import { salvarMensagem, publicarMensagem, rejeitarMensagem } from "./actions";

export const dynamic = "force-dynamic";

export default async function EditarMensagem({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [m, clusters, complementos, personas, autores] = await Promise.all([
    prisma.mensagem.findUnique({
      where: { id },
      include: {
        cluster: { select: { slug: true, nome: true } },
        persona: { select: { slug: true, nome: true } },
        autor: { select: { nome: true } },
        imagemHero: { select: { url: true, alt: true, modelo: true, custo: true } },
        imagemOg: { select: { url: true, alt: true, modelo: true } },
      },
    }),
    prisma.cluster.findMany({ where: { ativo: true }, select: { id: true, slug: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.complemento.findMany({ where: { ativo: true }, select: { id: true, nome: true, clusterId: true }, orderBy: { nome: "asc" } }),
    prisma.persona.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.author.findMany({ where: { ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  if (!m) notFound();

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/revisar" className="text-stone-500 hover:text-stone-900 text-sm">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-semibold flex-1 truncate">
          Editar mensagem
        </h1>
      </div>

      {(m.imagemHero || m.imagemOg) && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-5">
          <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-3">Mídia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {m.imagemHero && (
              <div>
                <div className="text-xs text-stone-500 mb-1.5">Hero · {m.imagemHero.modelo}{m.imagemHero.custo ? ` · R$ ${m.imagemHero.custo.toFixed(2)}` : ""}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imagemHero.url} alt={m.imagemHero.alt} className="rounded-lg border border-stone-200 w-full" />
              </div>
            )}
            {m.imagemOg && (
              <div>
                <div className="text-xs text-stone-500 mb-1.5">OG (compartilhamento) · {m.imagemOg.modelo}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.imagemOg.url} alt={m.imagemOg.alt} className="rounded-lg border border-stone-200 w-full" />
              </div>
            )}
          </div>
        </div>
      )}

      <MensagemEditor
        initial={{
          id: m.id,
          titulo: m.titulo,
          metaTitle: m.metaTitle ?? "",
          metaDescription: m.metaDescription ?? "",
          conteudo: m.conteudo,
          resumo: m.resumo ?? "",
          slug: m.slug,
          tipo: m.tipo,
          tier: m.tier,
          status: m.status,
          clusterId: m.clusterId,
          complementoId: m.complementoId,
          personaId: m.personaId,
          autorId: m.autorId,
          qualidade: m.qualidade,
          promoteOnShare: (m as { promoteOnShare?: boolean }).promoteOnShare ?? false,
        }}
        clusters={clusters}
        complementos={complementos}
        personas={personas}
        autores={autores}
        saveAction={salvarMensagem}
        publishAction={publicarMensagem}
        rejectAction={rejeitarMensagem}
      />
    </div>
  );
}
