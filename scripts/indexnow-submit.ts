/**
 * Envia TODAS as URLs indexáveis pro IndexNow API.
 * Bing/Yandex/Naver indexam em minutos (não requer OAuth, só key file no domínio).
 *
 * Estratégia:
 * - Bulk POST: até 10.000 URLs por request (spec IndexNow)
 * - Chunks de 5000 pra ficar seguro
 * - Endpoint: https://api.indexnow.org/indexnow (roteador único; distribui pra Bing/Yandex/Naver)
 *
 * Doc: https://www.indexnow.org/documentation
 *
 * Uso:
 *   pnpm exec tsx scripts/indexnow-submit.ts             # submete tudo (clusters + msgs + autores + blog)
 *   pnpm exec tsx scripts/indexnow-submit.ts --recent=7  # só URLs modificadas últimos 7 dias
 *   pnpm exec tsx scripts/indexnow-submit.ts --dry       # dry-run
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
const HOST = "www.portalsoma.com.br";
const SITE_URL = `https://${HOST}`;
const KEY = process.env.INDEXNOW_KEY;
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

if (!KEY) {
  console.error("INDEXNOW_KEY missing in .env");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [[m[1], m[2] ?? "true"]] : [];
  }),
);
const RECENT_DAYS = args.recent ? Number(args.recent) : undefined;
const DRY = args.dry === "true";

async function collectUrls(): Promise<string[]> {
  const dateFilter = RECENT_DAYS
    ? { atualizadoEm: { gte: new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000) } }
    : {};

  const [mensagens, clusters, autores, posts, nichos] = await Promise.all([
    prisma.mensagem.findMany({
      where: { status: "PUBLISHED", ...dateFilter },
      select: {
        slug: true,
        cluster: { select: { slug: true, nicho: { select: { slug: true } } } },
      },
    }),
    prisma.cluster.findMany({
      where: { ativo: true, ...dateFilter },
      select: { slug: true, nicho: { select: { slug: true } } },
    }),
    prisma.author.findMany({ where: { ativo: true, ...dateFilter }, select: { slug: true } }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", ...dateFilter },
      select: { slug: true, categoria: { select: { slug: true } } },
    }).catch(() => []),
    prisma.nicho.findMany({ where: { ativo: true }, select: { slug: true } }),
  ]);

  const urls = new Set<string>();
  urls.add(`${SITE_URL}/`);
  urls.add(`${SITE_URL}/blog/`);
  urls.add(`${SITE_URL}/autor/`);

  for (const n of nichos) urls.add(`${SITE_URL}/${n.slug}/`);
  for (const c of clusters) urls.add(`${SITE_URL}/${c.nicho.slug}/${c.slug}/`);
  for (const m of mensagens) urls.add(`${SITE_URL}/${m.cluster.nicho.slug}/${m.cluster.slug}/${m.slug}/`);
  for (const a of autores) urls.add(`${SITE_URL}/autor/${a.slug}/`);
  for (const p of posts) urls.add(`${SITE_URL}/blog/${p.categoria.slug}/${p.slug}/`);

  return Array.from(urls);
}

async function submitChunk(urls: string[]): Promise<{ ok: boolean; status: number; body: string }> {
  const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok || res.status === 202, status: res.status, body: text.slice(0, 200) };
}

async function main() {
  console.log(`[indexnow] key=${KEY}`);
  console.log(`[indexnow] key location: ${KEY_LOCATION}`);
  console.log(`[indexnow] recent filter: ${RECENT_DAYS ? `${RECENT_DAYS} days` : "none (todo o site)"}`);

  const urls = await collectUrls();
  console.log(`[indexnow] total URLs coletadas: ${urls.length}`);

  if (DRY) {
    console.log(`[indexnow] DRY-RUN. Primeiras 5:`);
    urls.slice(0, 5).forEach((u) => console.log(`  ${u}`));
    console.log(`[indexnow] Últimas 3:`);
    urls.slice(-3).forEach((u) => console.log(`  ${u}`));
    await prisma.$disconnect();
    return;
  }

  const CHUNK = 5000;
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += CHUNK) chunks.push(urls.slice(i, i + CHUNK));

  let okCount = 0;
  let failCount = 0;
  for (const [idx, chunk] of chunks.entries()) {
    const r = await submitChunk(chunk);
    if (r.ok) {
      okCount += chunk.length;
      console.log(`  [chunk ${idx + 1}/${chunks.length}] OK ${r.status} · ${chunk.length} URLs enviadas`);
    } else {
      failCount += chunk.length;
      console.log(`  [chunk ${idx + 1}/${chunks.length}] FAIL ${r.status} · body: ${r.body}`);
    }
  }
  console.log(`\n[indexnow] done: ${okCount} URLs OK · ${failCount} fail`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
