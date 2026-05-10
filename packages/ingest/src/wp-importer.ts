/**
 * Importer do WordPress XML export.
 *
 * Uso:
 *   pnpm --filter @nivertotal/ingest import-wp -- --file ../../inputs/wp-export/dump.xml --dry-run
 *
 * Faz:
 *   1. Parseia XML do WP (RSS-style export)
 *   2. Pra cada item (post): identifica categoria → mapeia pra clusterSlug
 *   3. Cria/atualiza Mensagem com origem=IMPORT_WP, status=REVIEW
 *   4. Gera Redirect 301 da URL antiga → nova
 *   5. Output: CSV com mapping + relatório de cobertura
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { prisma } from "@nivertotal/db";
import { mapearCategoriaWP } from "./wp-categoria-map.js";

const Args = z.object({
  file: z.string(),
  dryRun: z.boolean().default(false),
  autorSlug: z.string().default("equipe-editorial"),
  limit: z.number().optional(),
});

interface WpItem {
  title: string;
  link: string;
  pubDate: string;
  "content:encoded"?: string;
  "wp:post_id"?: number;
  "wp:post_name"?: string;
  "wp:post_type"?: string;
  "wp:status"?: string;
  category?: WpCategory | WpCategory[];
}

interface WpCategory {
  "#text": string;
  "@_domain"?: string;
  "@_nicename"?: string;
}

function parseArgs(): z.infer<typeof Args> {
  const argv = process.argv.slice(2);
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };
  return Args.parse({
    file: get("file") ?? "",
    dryRun: argv.includes("--dry-run"),
    autorSlug: get("autor") ?? "equipe-editorial",
    limit: get("limit") ? parseInt(get("limit")!, 10) : undefined,
  });
}

interface ImportRow {
  wpId: number;
  oldUrl: string;
  newUrl: string;
  clusterSlug: string;
  complementoSlug?: string;
  status: "imported" | "skipped" | "no_mapping" | "duplicate";
  reason?: string;
}

async function main() {
  const args = parseArgs();
  if (!args.file) {
    console.error("Use: --file <path> [--dry-run] [--limit N]");
    process.exit(1);
  }

  const filePath = resolve(args.file);
  console.log(`📥 Lendo ${filePath}`);
  const xml = await readFile(filePath, "utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    isArray: (name) => name === "item" || name === "category",
  });
  const parsed = parser.parse(xml);
  const items: WpItem[] = parsed?.rss?.channel?.item ?? [];
  console.log(`📦 ${items.length} items no XML`);

  const autor = await prisma.author.findUnique({ where: { slug: args.autorSlug } });
  if (!autor) {
    console.error(`Autor "${args.autorSlug}" não encontrado. Rode pnpm db:seed primeiro.`);
    process.exit(1);
  }

  const rows: ImportRow[] = [];
  const limite = args.limit ?? items.length;
  let idx = 0;

  for (const item of items) {
    if (idx >= limite) break;
    idx++;

    if (item["wp:post_type"] !== "post" || item["wp:status"] !== "publish") continue;

    const wpId = item["wp:post_id"] ?? 0;
    const oldUrl = new URL(item.link).pathname;
    const slug = item["wp:post_name"] ?? "";
    const conteudo = stripHtml(item["content:encoded"] ?? "").trim();
    if (!conteudo || conteudo.length < 30) {
      rows.push({ wpId, oldUrl, newUrl: "", clusterSlug: "", status: "skipped", reason: "conteudo curto/vazio" });
      continue;
    }

    // Categoria principal: primeiro <category domain="category">
    const cats = Array.isArray(item.category) ? item.category : item.category ? [item.category] : [];
    const cat = cats.find((c) => c["@_domain"] === "category");
    const catSlug = cat?.["@_nicename"];
    if (!catSlug) {
      rows.push({ wpId, oldUrl, newUrl: "", clusterSlug: "", status: "no_mapping", reason: "sem categoria" });
      continue;
    }

    const mapping = mapearCategoriaWP(catSlug);
    if (!mapping) {
      rows.push({ wpId, oldUrl, newUrl: "", clusterSlug: "", status: "no_mapping", reason: `categoria "${catSlug}" não mapeada` });
      continue;
    }

    const cluster = await prisma.cluster.findFirst({
      where: { slug: mapping.clusterSlug, ativo: true },
      include: { nicho: { select: { slug: true } } },
    });
    if (!cluster) {
      rows.push({ wpId, oldUrl, newUrl: "", clusterSlug: mapping.clusterSlug, status: "no_mapping", reason: "cluster não encontrado no DB" });
      continue;
    }

    const complemento = mapping.complementoSlug
      ? await prisma.complemento.findFirst({
          where: { slug: mapping.complementoSlug, clusterId: cluster.id, ativo: true },
        })
      : null;

    const newUrl = `/${cluster.nicho.slug}/${cluster.slug}/${slug}/`;

    if (args.dryRun) {
      rows.push({ wpId, oldUrl, newUrl, clusterSlug: cluster.slug, complementoSlug: complemento?.slug, status: "imported" });
      continue;
    }

    try {
      await prisma.mensagem.upsert({
        where: { slug },
        create: {
          slug,
          titulo: item.title,
          conteudo,
          resumo: conteudo.slice(0, 155),
          clusterId: cluster.id,
          complementoId: complemento?.id,
          autorId: autor.id,
          status: "REVIEW",
          tier: "TIER_3",
          origem: "IMPORT_WP",
          publicadoEm: new Date(item.pubDate),
        },
        update: {
          titulo: item.title,
          conteudo,
          clusterId: cluster.id,
          complementoId: complemento?.id,
        },
      });

      await prisma.redirect.upsert({
        where: { origem: oldUrl },
        create: { origem: oldUrl, destino: newUrl, status: 301 },
        update: { destino: newUrl },
      });

      rows.push({ wpId, oldUrl, newUrl, clusterSlug: cluster.slug, complementoSlug: complemento?.slug, status: "imported" });
    } catch (e) {
      const erro = e instanceof Error ? e.message : String(e);
      rows.push({ wpId, oldUrl, newUrl, clusterSlug: cluster.slug, status: "duplicate", reason: erro });
    }
  }

  // Relatório
  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log("\n📊 Relatório:");
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);

  // Salva CSV
  const csvLines = ["wp_id,old_url,new_url,cluster,complemento,status,reason"];
  for (const r of rows) {
    csvLines.push(
      [r.wpId, r.oldUrl, r.newUrl, r.clusterSlug, r.complementoSlug ?? "", r.status, r.reason ?? ""]
        .map((x) => `"${String(x).replace(/"/g, '""')}"`)
        .join(","),
    );
  }
  const csvPath = resolve(filePath.replace(/\.xml$/, "") + "-import-report.csv");
  await writeFile(csvPath, csvLines.join("\n"), "utf-8");
  console.log(`\n💾 Relatório salvo: ${csvPath}`);

  if (args.dryRun) console.log("\n⚠️  DRY-RUN: nada foi gravado no DB.");
  else console.log("\n✅ Importação concluída. Mensagens com status=REVIEW.");

  await prisma.$disconnect();
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
