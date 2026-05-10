/**
 * Aprova TODAS as mensagens em REVIEW de uma vez.
 * - Regenera slug se for placeholder (smoke-*, pending-*)
 * - Garante unicidade
 * - Status = PUBLISHED, publicadoEm = now()
 */

import { prisma } from "@nivertotal/db";

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

async function main() {
  const t0 = Date.now();

  const total = await prisma.mensagem.count({ where: { status: "REVIEW" } });
  console.log(`\n📋 ${total} mensagens em REVIEW. Iniciando aprovação em massa...\n`);

  // Carrega tudo (id + slug + titulo) — leve
  const todas = await prisma.mensagem.findMany({
    where: { status: "REVIEW" },
    select: { id: true, slug: true, titulo: true },
  });

  // Cache de slugs já usados (pra evitar collision em batch)
  const slugsUsados = new Set<string>();
  const existentes = await prisma.mensagem.findMany({
    where: { status: { in: ["PUBLISHED", "REJECTED"] } },
    select: { slug: true },
  });
  for (const e of existentes) slugsUsados.add(e.slug);

  let ok = 0, fail = 0, slugTrocado = 0;
  const now = new Date();

  for (let i = 0; i < todas.length; i++) {
    const m = todas[i]!;
    let slug = m.slug;

    // Regenera slug se for placeholder
    if (slug.startsWith("pending-") || slug.startsWith("smoke-")) {
      const base = gerarSlug(m.titulo);
      let cand = base;
      let suffix = 0;
      while (slugsUsados.has(cand)) {
        suffix++;
        cand = `${base}-${suffix}`;
        if (suffix > 100) {
          cand = `${base}-${m.id.slice(-6)}`;
          break;
        }
      }
      slug = cand;
      slugTrocado++;
    }

    try {
      await prisma.mensagem.update({
        where: { id: m.id },
        data: { status: "PUBLISHED", publicadoEm: now, slug },
      });
      slugsUsados.add(slug);
      ok++;
    } catch (e) {
      fail++;
      console.error(`[${i+1}/${todas.length}] FAIL ${m.id}:`, e instanceof Error ? e.message : e);
    }

    if ((i + 1) % 100 === 0) {
      const pct = (((i + 1) / todas.length) * 100).toFixed(0);
      const taxa = (i + 1) / ((Date.now() - t0) / 1000);
      console.log(`  [${i+1}/${todas.length}] ${pct}% | ok=${ok} fail=${fail} slugTrocado=${slugTrocado} | ${taxa.toFixed(0)} msg/s`);
    }
  }

  const elapsed = (Date.now() - t0) / 1000;
  console.log(`\n✅ APROVAÇÃO EM MASSA CONCLUÍDA`);
  console.log(`   ${ok} OK · ${fail} FAIL`);
  console.log(`   ${slugTrocado} slugs regenerados de placeholder`);
  console.log(`   ⏱  ${elapsed.toFixed(0)}s`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
