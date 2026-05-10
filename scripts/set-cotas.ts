/**
 * Configura cotaDiaria de cada cluster baseado em prioridade (tem URL legado com tráfego = priority).
 *
 * Cota:
 *   - prioritário (com URL antigo no GSC): 1 mensagem/dia
 *   - secundário: 0 (ativar manualmente quando der)
 *
 * LIMITE_GLOBAL_DIA recomendado: 50 (cap de segurança no scheduler).
 */

import { prisma } from "@nivertotal/db";
import { readFileSync } from "node:fs";

async function main() {
  const data = JSON.parse(
    readFileSync("C:/Users/lucas 1/Desktop/LUCAS/nivertotal/inputs/wp-export/crawled-content.json", "utf-8"),
  ) as Array<{ oldUrl: string }>;

  // Build slug map antigo→novo via redirects 301
  const redirects = await prisma.redirect.findMany({ where: { status: 301, ativo: true }, select: { origem: true, destino: true } });
  const slugMap: Record<string, string> = {};
  for (const r of redirects) {
    const oldFirst = r.origem.replace(/^\/mensagem-de-aniversario\//, "").replace(/\/$/, "").split("/")[0];
    const newFirst = r.destino.replace(/^\/mensagem-de-aniversario\//, "").replace(/\/$/, "").split("/")[0];
    if (oldFirst && newFirst && !slugMap[oldFirst]) slugMap[oldFirst] = newFirst;
  }

  const prioritySlugs = new Set<string>();
  for (const it of data) {
    const oldSlug = it.oldUrl.replace(/^\/mensagem-de-aniversario\//, "").replace(/\/$/, "").split("/")[0];
    if (oldSlug && slugMap[oldSlug]) prioritySlugs.add(slugMap[oldSlug]);
  }

  console.log(`Slugs prioritários: ${prioritySlugs.size}`);

  const allClusters = await prisma.cluster.findMany({ select: { id: true, slug: true } });
  let updPriority = 0;
  let updSecondary = 0;
  for (const c of allClusters) {
    const cota = prioritySlugs.has(c.slug) ? 1 : 0;
    await prisma.cluster.update({ where: { id: c.id }, data: { cotaDiaria: cota } });
    if (cota === 1) updPriority++;
    else updSecondary++;
  }

  console.log(`✅ ${updPriority} clusters com cota=1 (prioritários)`);
  console.log(`   ${updSecondary} clusters com cota=0 (secundários, ativar depois)`);
  console.log(`\nLIMITE_GLOBAL_DIA recomendado: 50 (cap no scheduler env).`);
  console.log(`Para subir scheduler: \`pnpm dev:workers\` ou via Coolify.`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
