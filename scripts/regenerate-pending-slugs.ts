/**
 * Pra cada mensagem com slug "pending-*" ou "smoke-*", gera slug ASCII do título,
 * garante unicidade e re-promove status pra PUBLISHED.
 *
 * Resolve o issue de mensagens criadas pelo scheduler que ficaram com slug
 * placeholder e foram publicadas via SQL direto sem regeneração de slug.
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
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const placeholders = await prisma.mensagem.findMany({
    where: {
      OR: [
        { slug: { startsWith: "pending-" } },
        { slug: { startsWith: "smoke-" } },
      ],
    },
    select: { id: true, slug: true, titulo: true, status: true },
  });

  console.log(`\n🔧 Fix pending slugs — encontradas ${placeholders.length}\n`);

  let fixed = 0;
  let promoted = 0;
  let skipped = 0;

  for (const m of placeholders) {
    if (!m.titulo || m.titulo.includes("(gerando") || m.titulo.length < 8) {
      skipped++;
      continue;
    }
    let baseSlug = normalizeSlug(m.titulo);
    if (!baseSlug) {
      console.warn(`  [skip] ${m.id} | titulo vazio | slug original "${m.slug}"`);
      skipped++;
      continue;
    }

    let finalSlug = baseSlug;
    let suffix = 0;
    while (true) {
      const collision = await prisma.mensagem.findFirst({
        where: { slug: finalSlug, id: { not: m.id } },
        select: { id: true },
      });
      if (!collision) break;
      suffix++;
      finalSlug = `${baseSlug}-${suffix}`;
      if (suffix > 50) {
        finalSlug = `${baseSlug}-${m.id.slice(-6)}`;
        break;
      }
    }

    console.log(`  ${dryRun ? "[dry]" : "[fix]"} ${m.slug.slice(0, 40)} → ${finalSlug} | "${m.titulo.slice(0, 50)}"`);

    if (!dryRun) {
      const newStatus = m.status === "DRAFT" ? "PUBLISHED" : m.status;
      await prisma.mensagem.update({
        where: { id: m.id },
        data: {
          slug: finalSlug,
          status: newStatus,
          publicadoEm: newStatus === "PUBLISHED" ? new Date() : undefined,
        },
      });
      fixed++;
      if (newStatus === "PUBLISHED" && m.status !== "PUBLISHED") promoted++;
    } else {
      fixed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${dryRun ? "(dry-run) " : "✅ "}${fixed} slugs corrigidos · ${promoted} promovidos PUBLISHED · ${skipped} skipped`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
