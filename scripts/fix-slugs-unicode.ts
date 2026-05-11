/**
 * Fix slugs com chars unicode (ç, ã, é, etc) — Next router não resolve corretamente.
 * Encontra todas Mensagens com slug não-ASCII, normaliza pra ASCII, e cria Redirect 301 do antigo → novo.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
config({ path: resolve(__dirname_local, "..", ".env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const mensagens = await prisma.mensagem.findMany({
    where: { status: "PUBLISHED" },
    include: { cluster: { include: { nicho: { select: { slug: true } } } } },
  });

  const broken = mensagens.filter((m) => !/^[a-z0-9-]+$/.test(m.slug));
  console.log(`\n📊 ${mensagens.length} mensagens publicadas, ${broken.length} com slug não-ASCII\n`);

  if (broken.length === 0) {
    console.log("Nada a corrigir.");
    await prisma.$disconnect();
    return;
  }

  let fixed = 0;
  let skipped = 0;
  let redirects = 0;

  for (const m of broken) {
    const newSlug = normalizeSlug(m.slug);
    if (!newSlug) {
      console.warn(`  [skip] ${m.id} | slug vazio após normalize | original="${m.slug}"`);
      skipped++;
      continue;
    }

    // Verifica colisão
    const collision = await prisma.mensagem.findFirst({
      where: { slug: newSlug, id: { not: m.id } },
      select: { id: true },
    });

    let finalSlug = newSlug;
    if (collision) {
      let suffix = 2;
      while (true) {
        const cand = `${newSlug}-${suffix}`;
        const c2 = await prisma.mensagem.findFirst({ where: { slug: cand }, select: { id: true } });
        if (!c2) {
          finalSlug = cand;
          break;
        }
        suffix++;
      }
    }

    const oldPath = `/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/`;
    const newPath = `/${m.cluster.nicho.slug}/${m.cluster.slug}/${finalSlug}/`;

    console.log(`  ${dryRun ? "[dry]" : "[fix]"} ${m.id} | "${m.slug}" → "${finalSlug}"`);

    if (!dryRun) {
      await prisma.mensagem.update({
        where: { id: m.id },
        data: { slug: finalSlug },
      });

      // Cria Redirect 301 (upsert pra não conflitar se já existir)
      try {
        await prisma.redirect.upsert({
          where: { origem: oldPath },
          update: { destino: newPath, status: 301, ativo: true },
          create: { origem: oldPath, destino: newPath, status: 301, ativo: true },
        });
        redirects++;
      } catch (e) {
        console.warn(`    [warn] redirect upsert: ${e instanceof Error ? e.message : e}`);
      }
      fixed++;
    } else {
      fixed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${dryRun ? "(dry-run)" : "✅"} ${fixed} slugs ${dryRun ? "seriam" : "foram"} corrigidos · ${redirects} redirects 301 ${dryRun ? "seriam" : "foram"} criados · ${skipped} skipped`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
