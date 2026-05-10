"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@nivertotal/db";

/**
 * Server actions da tela de revisão.
 *
 * Aprovar = status REVIEW → PUBLISHED + publicadoEm now() + slug normalizado
 * Rejeitar = status REVIEW → REJECTED
 * Aprovar lote = aprova top N por qualidade ≥ X
 */

export async function aprovarMensagem(id: string) {
  const m = await prisma.mensagem.findUnique({ where: { id } });
  if (!m) return;

  // Se ainda tem slug placeholder (gerado pelo scheduler antes do generator preencher),
  // gera slug a partir do título
  let slug = m.slug;
  if (slug.startsWith("pending-")) {
    slug = gerarSlug(m.titulo);
    // garante unicidade
    let suffix = 0;
    while (true) {
      const candidato = suffix === 0 ? slug : `${slug}-${suffix}`;
      const existe = await prisma.mensagem.findUnique({ where: { slug: candidato } });
      if (!existe) {
        slug = candidato;
        break;
      }
      suffix++;
    }
  }

  await prisma.mensagem.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publicadoEm: new Date(),
      slug,
    },
  });

  revalidatePath("/revisar");
  revalidatePath("/mensagens");
}

export async function rejeitarMensagem(id: string) {
  await prisma.mensagem.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  revalidatePath("/revisar");
}

export async function aprovarLote(formData: FormData) {
  const quantidade = parseInt((formData.get("quantidade") as string) ?? "10", 10);
  const qualidadeMin = parseFloat((formData.get("qualidadeMin") as string) ?? "0.85");

  const candidatos = await prisma.mensagem.findMany({
    where: {
      status: "REVIEW",
      qualidade: { gte: qualidadeMin },
    },
    orderBy: { qualidade: "desc" },
    take: quantidade,
    select: { id: true, slug: true, titulo: true },
  });

  for (const c of candidatos) {
    let slug = c.slug;
    if (slug.startsWith("pending-")) {
      slug = gerarSlug(c.titulo);
      let suffix = 0;
      while (true) {
        const candidato = suffix === 0 ? slug : `${slug}-${suffix}`;
        const existe = await prisma.mensagem.findUnique({ where: { slug: candidato } });
        if (!existe || existe.id === c.id) {
          slug = candidato;
          break;
        }
        suffix++;
      }
    }
    await prisma.mensagem.update({
      where: { id: c.id },
      data: { status: "PUBLISHED", publicadoEm: new Date(), slug },
    });
  }

  revalidatePath("/revisar");
  revalidatePath("/mensagens");
}

function gerarSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
