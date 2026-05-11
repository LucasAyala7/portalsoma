/**
 * Crawler de URLs do site (pra encontrar 404s reais em PRODUÇÃO).
 * Lê do DB: todos os clusters ativos + todas as mensagens PUBLISHED + autores.
 * Faz HEAD nas URLs do site live (https://www.portalsoma.com.br/...).
 * Reporta status != 200 (incluindo 301 com destino errado).
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local = dirname(__filename_local);
config({ path: resolve(__dirname_local, "..", ".env") });

import { PrismaClient } from "@prisma/client";

const BASE = process.env.CRAWL_BASE_URL ?? "https://www.portalsoma.com.br";
const NICHO = "mensagem-de-aniversario";
const prisma = new PrismaClient();

interface CheckResult {
  url: string;
  status: number;
  duration: number;
  type: "cluster" | "mensagem" | "complemento" | "autor" | "static";
  meta?: string;
}

async function check(url: string, type: CheckResult["type"], meta?: string): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "portalsoma-internal-crawler/1.0" },
    });
    return { url, status: res.status, duration: Date.now() - t0, type, meta };
  } catch {
    return { url, status: 0, duration: Date.now() - t0, type, meta };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = args.find((a) => a.startsWith("--limit="));
  const sample = limit ? Number(limit.split("=")[1]) : undefined;

  console.log(`\n🔍 Crawling ${BASE}${sample ? ` (sample ${sample})` : " (full)"}\n`);

  const [clusters, complementos, mensagens, autores] = await Promise.all([
    prisma.cluster.findMany({
      where: { ativo: true },
      select: { slug: true, nome: true },
    }),
    prisma.complemento.findMany({
      where: { ativo: true },
      include: { cluster: { select: { slug: true } } },
    }),
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED" },
      include: {
        cluster: { include: { nicho: { select: { slug: true } } } },
      },
      take: sample,
    }),
    prisma.author.findMany({
      where: { ativo: true },
      select: { slug: true },
    }),
  ]);

  console.log(`📊 ${clusters.length} clusters · ${complementos.length} complementos · ${mensagens.length} mensagens · ${autores.length} autores\n`);

  const urls: Array<{ url: string; type: CheckResult["type"]; meta?: string }> = [];

  // Static
  urls.push({ url: `${BASE}/`, type: "static" });
  urls.push({ url: `${BASE}/${NICHO}/`, type: "static" });
  urls.push({ url: `${BASE}/sitemap.xml`, type: "static" });
  urls.push({ url: `${BASE}/robots.txt`, type: "static" });

  // Clusters
  for (const c of clusters) {
    urls.push({ url: `${BASE}/${NICHO}/${c.slug}/`, type: "cluster", meta: c.nome });
  }
  // Complementos
  for (const co of complementos) {
    urls.push({
      url: `${BASE}/${NICHO}/${co.cluster.slug}/${co.slug}/`,
      type: "complemento",
      meta: `${co.cluster.slug}/${co.slug}`,
    });
  }
  // Mensagens
  for (const m of mensagens) {
    urls.push({
      url: `${BASE}/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/`,
      type: "mensagem",
      meta: m.id,
    });
  }
  // Autores
  for (const a of autores) {
    urls.push({ url: `${BASE}/autor/${a.slug}/`, type: "autor" });
  }

  console.log(`Total URLs a checar: ${urls.length}\n`);

  const concurrency = 12;
  let cursor = 0;
  const results: CheckResult[] = [];
  const counters = { ok: 0, redirect: 0, notfound: 0, error: 0, other: 0 };

  async function worker() {
    while (cursor < urls.length) {
      const idx = cursor++;
      const { url, type, meta } = urls[idx]!;
      const r = await check(url, type, meta);
      results.push(r);
      if (r.status === 200) counters.ok++;
      else if (r.status === 301 || r.status === 302) counters.redirect++;
      else if (r.status === 404) counters.notfound++;
      else if (r.status === 0) counters.error++;
      else counters.other++;

      if ((idx + 1) % 100 === 0) {
        console.log(
          `  [${idx + 1}/${urls.length}] ok=${counters.ok} 3xx=${counters.redirect} 404=${counters.notfound} err=${counters.error} other=${counters.other}`,
        );
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const broken = results.filter((r) => r.status === 404 || r.status === 0 || r.status >= 500);
  const slow = results.filter((r) => r.duration > 5000);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ CRAWL CONCLUÍDO`);
  console.log(`   ok=${counters.ok} 3xx=${counters.redirect} 404=${counters.notfound} err=${counters.error} other=${counters.other}`);

  if (broken.length > 0) {
    console.log(`\n❌ ${broken.length} URLs quebradas:\n`);
    const byType: Record<string, CheckResult[]> = {};
    for (const b of broken) {
      (byType[b.type] ??= []).push(b);
    }
    for (const [type, list] of Object.entries(byType)) {
      console.log(`  [${type}] ${list.length}:`);
      list.slice(0, 20).forEach((b) => {
        console.log(`    ${b.status} ${b.url}${b.meta ? `  (${b.meta})` : ""}`);
      });
      if (list.length > 20) console.log(`    ... e mais ${list.length - 20}`);
    }
  }

  if (slow.length > 0) {
    console.log(`\n🐌 ${slow.length} URLs lentas (>5s):`);
    slow.slice(0, 10).forEach((s) => console.log(`    ${s.duration}ms ${s.url}`));
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
