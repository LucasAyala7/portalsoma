"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@nivertotal/db";
import type { PostEditorData } from "../PostEditor";
import { calcWordCount, calcTempoLeitura, normalizeSlug, parseTags, garantirSlugUnico } from "../utils";

export async function criarPost(data: PostEditorData) {
  if (!data.titulo.trim() || !data.conteudo.trim()) {
    return { ok: false, error: "Título e conteúdo obrigatórios" };
  }

  const baseSlug = data.slug.trim() || normalizeSlug(data.titulo);
  if (!baseSlug) {
    return { ok: false, error: "Slug inválido (vazio após normalize)" };
  }

  const slug = await garantirSlugUnico(baseSlug);
  const wordCount = calcWordCount(data.conteudo);
  const tempoLeitura = calcTempoLeitura(wordCount);
  const tagsArr = parseTags(data.tags);

  try {
    const created = await prisma.post.create({
      data: {
        slug,
        titulo: data.titulo.trim(),
        metaTitle: data.metaTitle.trim() || null,
        metaDescription: data.metaDescription.trim() || null,
        conteudo: data.conteudo.trim(),
        resumo: data.resumo.trim() || null,
        status: "DRAFT",
        origem: data.origem,
        categoriaId: data.categoriaId,
        autorId: data.autorId,
        tags: tagsArr,
        wordCount,
        tempoLeitura,
      },
    });
    revalidatePath("/blog");
    return { ok: true, id: created.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}
