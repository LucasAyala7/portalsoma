/**
 * Importa redirects.csv + categorias.csv pra tabela Redirect no DB.
 * + Importa gone.csv pra registrar URLs 410 (status=410, ativo=true).
 *
 * Uso (de packages/db):
 *   npx tsx ../../scripts/import-redirects.ts
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "@nivertotal/db";

async function main() {
  const inputDir = resolve(__dirname, "..", "..", "inputs", "wp-export");

  // === 1. Redirects 301 (posts WP com tráfego — A_KEEP, B_SAVE, C_EVAL) ===
  const redirectsBuf = await readFile(resolve(inputDir, "redirects.csv"), "utf-8");
  const redirectRows: { oldUrl: string; newUrl: string; bucket: string }[] = parse(redirectsBuf, {
    columns: true,
    skip_empty_lines: true,
  });

  let count301 = 0;
  for (const r of redirectRows) {
    if (!r.newUrl) continue;
    await prisma.redirect.upsert({
      where: { origem: r.oldUrl },
      create: { origem: r.oldUrl, destino: r.newUrl, status: 301, ativo: true },
      update: { destino: r.newUrl, status: 301, ativo: true },
    });
    count301++;
  }
  console.log(`✓ ${count301} redirects 301 (posts WP) importados`);

  // === 2. Redirects 301 das páginas de CATEGORIA do GSC ===
  const categoriasBuf = await readFile(resolve(inputDir, "categorias.csv"), "utf-8");
  const catRows: { oldUrl: string; targetCluster: string; bucket: string; cliques: string; impressoes: string }[] = parse(categoriasBuf, {
    columns: true,
    skip_empty_lines: true,
  });

  let countCat = 0;
  let countCatGone = 0;
  for (const r of catRows) {
    if (r.targetCluster) {
      const newUrl = `/mensagem-de-aniversario/${r.targetCluster}/`;
      await prisma.redirect.upsert({
        where: { origem: r.oldUrl },
        create: { origem: r.oldUrl, destino: newUrl, status: 301, ativo: true },
        update: { destino: newUrl, status: 301, ativo: true },
      });
      countCat++;
    } else {
      // sem mapping → 410
      await prisma.redirect.upsert({
        where: { origem: r.oldUrl },
        create: { origem: r.oldUrl, destino: "", status: 410, ativo: true },
        update: { destino: "", status: 410, ativo: true },
      });
      countCatGone++;
    }
  }
  console.log(`✓ ${countCat} redirects 301 (páginas categoria GSC) importados`);
  console.log(`✓ ${countCatGone} redirects 410 (páginas categoria sem cluster) importados`);

  // === 3. Gone 410 (posts WP sem tráfego — D_GONE) ===
  const goneBuf = await readFile(resolve(inputDir, "gone.csv"), "utf-8");
  const goneRows: { oldUrl: string; reason: string }[] = parse(goneBuf, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`📦 Importando ${goneRows.length} URLs como 410 (em batches de 1000)...`);
  for (let i = 0; i < goneRows.length; i += 1000) {
    const batch = goneRows.slice(i, i + 1000);
    await prisma.$transaction(
      batch.map((r) =>
        prisma.redirect.upsert({
          where: { origem: r.oldUrl },
          create: { origem: r.oldUrl, destino: "", status: 410, ativo: true },
          update: { status: 410, ativo: true },
        }),
      ),
    );
    if ((i + 1000) % 2000 === 0) console.log(`   ${Math.min(i + 1000, goneRows.length)}/${goneRows.length}`);
  }

  // === Stats finais ===
  const total301 = await prisma.redirect.count({ where: { status: 301, ativo: true } });
  const total410 = await prisma.redirect.count({ where: { status: 410, ativo: true } });
  console.log(`\n=== TOTAL NO DB ===`);
  console.log(`Redirects 301: ${total301}`);
  console.log(`Gone 410:      ${total410}`);
  console.log(`Total:         ${total301 + total410}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
