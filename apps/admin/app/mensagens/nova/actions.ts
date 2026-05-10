"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@nivertotal/db";
import type { MensagemEditorData } from "../MensagemEditor";

export async function criarMensagem(data: MensagemEditorData) {
  if (!data.titulo.trim() || !data.conteudo.trim()) {
    return { ok: false, error: "Título e conteúdo obrigatórios" };
  }

  let slug = data.slug.trim() || gerarSlug(data.titulo);
  let suffix = 0;
  while (true) {
    const cand = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existe = await prisma.mensagem.findUnique({ where: { slug: cand } });
    if (!existe) {
      slug = cand;
      break;
    }
    suffix++;
    if (suffix > 50) return { ok: false, error: "Falha ao gerar slug único" };
  }

  const wordCount = data.conteudo.trim().split(/\s+/).filter(Boolean).length;

  try {
    const created = await prisma.mensagem.create({
      data: {
        slug,
        titulo: data.titulo.trim(),
        metaTitle: data.metaTitle.trim() || null,
        metaDescription: data.metaDescription.trim() || null,
        conteudo: data.conteudo.trim(),
        resumo: data.resumo.trim() || null,
        tipo: data.tipo,
        tier: data.tier,
        status: "REVIEW",
        origem: "MANUAL",
        clusterId: data.clusterId,
        complementoId: data.complementoId,
        personaId: data.personaId,
        autorId: data.autorId,
        wordCount,
      },
    });
    revalidatePath("/mensagens");
    revalidatePath("/revisar");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}
