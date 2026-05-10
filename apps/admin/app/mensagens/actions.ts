"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@nivertotal/db";

export async function bulkAction(formData: FormData) {
  const ids = formData.getAll("ids").filter((v): v is string => typeof v === "string" && v.length > 0);
  const action = formData.get("action") as string;

  if (ids.length === 0) return;

  if (action === "publish") {
    for (const id of ids) {
      const m = await prisma.mensagem.findUnique({ where: { id } });
      if (!m) continue;
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
    }
  } else if (action === "reject") {
    await prisma.mensagem.updateMany({
      where: { id: { in: ids } },
      data: { status: "REJECTED" },
    });
  } else if (action === "review") {
    await prisma.mensagem.updateMany({
      where: { id: { in: ids } },
      data: { status: "REVIEW" },
    });
  } else if (action === "tier1" || action === "tier2" || action === "tier3") {
    const tier = action === "tier1" ? "TIER_1" : action === "tier2" ? "TIER_2" : "TIER_3";
    await prisma.mensagem.updateMany({
      where: { id: { in: ids } },
      data: { tier },
    });
  } else if (action === "delete") {
    await prisma.mensagem.deleteMany({ where: { id: { in: ids } } });
  }

  revalidatePath("/mensagens");
  revalidatePath("/revisar");
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
