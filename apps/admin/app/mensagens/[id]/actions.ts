"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@nivertotal/db";
import type { MensagemEditorData } from "../MensagemEditor";

const STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "REJECTED"]);

export async function salvarMensagem(data: MensagemEditorData) {
  if (!data.id) return { ok: false, error: "ID ausente" };
  if (!data.titulo.trim() || !data.conteudo.trim()) {
    return { ok: false, error: "Título e conteúdo obrigatórios" };
  }
  if (!STATUSES.has(data.status)) {
    return { ok: false, error: "Status inválido" };
  }

  const wordCount = data.conteudo.trim().split(/\s+/).filter(Boolean).length;

  try {
    await prisma.mensagem.update({
      where: { id: data.id },
      data: {
        titulo: data.titulo.trim(),
        metaTitle: data.metaTitle.trim() || null,
        metaDescription: data.metaDescription.trim() || null,
        conteudo: data.conteudo.trim(),
        resumo: data.resumo.trim() || null,
        slug: data.slug.trim(),
        tipo: data.tipo,
        tier: data.tier,
        clusterId: data.clusterId,
        complementoId: data.complementoId,
        personaId: data.personaId,
        autorId: data.autorId,
        wordCount,
        ...(data.promoteOnShare !== undefined ? { promoteOnShare: data.promoteOnShare } : {}),
      } as Parameters<typeof prisma.mensagem.update>[0]["data"],
    });
    revalidatePath(`/mensagens/${data.id}`);
    revalidatePath("/mensagens");
    revalidatePath("/revisar");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}

export async function publicarMensagem(id: string) {
  const m = await prisma.mensagem.findUnique({ where: { id } });
  if (!m) return { ok: false, error: "Não encontrada" };

  let slug = m.slug;
  if (slug.startsWith("pending-") || slug.startsWith("smoke-")) {
    slug = gerarSlug(m.titulo);
    let suffix = 0;
    while (true) {
      const cand = suffix === 0 ? slug : `${slug}-${suffix}`;
      const existe = await prisma.mensagem.findUnique({ where: { slug: cand } });
      if (!existe || existe.id === m.id) {
        slug = cand;
        break;
      }
      suffix++;
    }
  }

  await prisma.mensagem.update({
    where: { id },
    data: { status: "PUBLISHED", publicadoEm: new Date(), slug },
  });
  revalidatePath("/revisar");
  revalidatePath("/mensagens");
  return { ok: true };
}

export async function rejeitarMensagem(id: string) {
  await prisma.mensagem.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath("/revisar");
  revalidatePath("/mensagens");
  return { ok: true };
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
