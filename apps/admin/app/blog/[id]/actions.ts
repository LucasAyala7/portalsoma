"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@nivertotal/db";
import type { PostEditorData } from "../PostEditor";
import { calcWordCount, calcTempoLeitura, normalizeSlug, parseTags, garantirSlugUnico } from "../utils";

const STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "REJECTED", "ARCHIVED"]);
const ORIGENS = new Set(["IA", "MANUAL", "IMPORT_WP", "IMPORT_BULK"]);

async function revalidatePostPaths(post: { slug: string; categoria?: { slug: string } | null } | null) {
  revalidatePath("/blog");
  if (post?.categoria?.slug) {
    revalidatePath(`/blog/${post.categoria.slug}`);
    revalidatePath(`/blog/${post.categoria.slug}/${post.slug}`);
  }
}

export async function salvarPost(data: PostEditorData) {
  if (!data.id) return { ok: false, error: "ID ausente" };
  if (!data.titulo.trim() || !data.conteudo.trim()) {
    return { ok: false, error: "Título e conteúdo obrigatórios" };
  }
  if (!STATUSES.has(data.status)) {
    return { ok: false, error: "Status inválido" };
  }
  if (!ORIGENS.has(data.origem)) {
    return { ok: false, error: "Origem inválida" };
  }

  // Normaliza slug se mudou ou se vier sujo
  const slugInput = data.slug.trim();
  const baseSlug = slugInput ? normalizeSlug(slugInput) : normalizeSlug(data.titulo);
  if (!baseSlug) return { ok: false, error: "Slug inválido" };

  let finalSlug = baseSlug;
  try {
    finalSlug = await garantirSlugUnico(baseSlug, data.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro slug" };
  }

  const wordCount = calcWordCount(data.conteudo);
  const tempoLeitura = calcTempoLeitura(wordCount);
  const tagsArr = parseTags(data.tags);

  try {
    const updated = await prisma.post.update({
      where: { id: data.id },
      data: {
        titulo: data.titulo.trim(),
        metaTitle: data.metaTitle.trim() || null,
        metaDescription: data.metaDescription.trim() || null,
        conteudo: data.conteudo.trim(),
        resumo: data.resumo.trim() || null,
        slug: finalSlug,
        categoriaId: data.categoriaId,
        autorId: data.autorId,
        tags: tagsArr,
        origem: data.origem,
        wordCount,
        tempoLeitura,
      },
      include: { categoria: { select: { slug: true } } },
    });
    revalidatePath(`/blog/${data.id}`);
    await revalidatePostPaths(updated);
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}

export async function publicarPost(id: string) {
  const p = await prisma.post.findUnique({
    where: { id },
    include: { categoria: { select: { slug: true } } },
  });
  if (!p) return { ok: false, error: "Não encontrado" };

  // Se slug parece placeholder, regenera do título
  let slug = p.slug;
  if (slug.startsWith("pending-") || slug.startsWith("smoke-") || slug === "" || /^post-\d+$/.test(slug)) {
    const base = normalizeSlug(p.titulo);
    if (base) {
      try {
        slug = await garantirSlugUnico(base, p.id);
      } catch {
        // mantém slug original se falhar
      }
    }
  }

  // wordCount: usa armazenado se houver, senão recalcula
  const wordCount = p.wordCount ?? calcWordCount(p.conteudo);
  if (wordCount < 800) {
    console.warn(`[publicarPost] Post ${id} publicado com apenas ${wordCount} palavras (ideal >= 1200)`);
  }

  try {
    await prisma.post.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publicadoEm: new Date(),
        slug,
        wordCount,
        tempoLeitura: calcTempoLeitura(wordCount),
      },
    });
    await revalidatePostPaths({ slug, categoria: p.categoria });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}

export async function despublicarPost(id: string) {
  const p = await prisma.post.findUnique({
    where: { id },
    include: { categoria: { select: { slug: true } } },
  });
  if (!p) return { ok: false, error: "Não encontrado" };

  try {
    await prisma.post.update({
      where: { id },
      data: { status: "DRAFT", publicadoEm: null },
    });
    await revalidatePostPaths(p);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}

export async function deletarPost(id: string) {
  const p = await prisma.post.findUnique({
    where: { id },
    include: { categoria: { select: { slug: true } } },
  });
  if (!p) return { ok: false, error: "Não encontrado" };

  try {
    await prisma.post.delete({ where: { id } });
    await revalidatePostPaths(p);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro DB" };
  }
}
